import PocketBase from 'pocketbase';

const PB_URL = process.env.POCKETBASE_URL || 'http://130.210.55.88:8090';
const SUPERUSER_EMAIL = process.env.PB_SUPERUSER_EMAIL || 'yogesh.workstation@gmail.com';
const SUPERUSER_PASSWORD = process.env.PB_SUPERUSER_PASSWORD || 'Asd@1234';

const pb = new PocketBase(PB_URL);

async function authenticateSuperuser(): Promise<string> {
  const res = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: SUPERUSER_EMAIL, password: SUPERUSER_PASSWORD }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Superuser auth failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data.token;
}

async function getExistingCollections(token: string): Promise<any[]> {
  const res = await fetch(`${PB_URL}/api/collections?perPage=100`, {
    headers: { Authorization: token },
  });
  const data = await res.json();
  return data.items || [];
}

async function createOrUpdateCollection(token: string, schema: any, existingCols: any[]) {
  const existing = existingCols.find((c) => c.name === schema.name);
  if (existing) {
    console.log(`Updating collection '${schema.name}' (id: ${existing.id})...`);
    const res = await fetch(`${PB_URL}/api/collections/${existing.id}`, {
      method: 'PATCH',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(schema),
    });
    if (!res.ok) {
      const text = await res.text();
      console.warn(`Warning updating collection ${schema.name}: ${text}`);
      return existing;
    }
    const updated = await res.json();
    return updated;
  }

  console.log(`Creating collection '${schema.name}'...`);
  const res = await fetch(`${PB_URL}/api/collections`, {
    method: 'POST',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(schema),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create collection '${schema.name}': ${res.status} ${text}`);
  }

  const created = await res.json();
  console.log(`✓ Collection '${schema.name}' created successfully (id: ${created.id}).`);
  return created;
}

export async function initPocketBaseSchema() {
  console.log(`Connecting to PocketBase at ${PB_URL}...`);
  const token = await authenticateSuperuser();
  console.log('✓ Superuser authenticated successfully.');

  const existing = await getExistingCollections(token);
  console.log(`Found ${existing.length} existing collections.`);

  // 1. Users Collection (Auth Collection)
  let usersCol = existing.find((c) => c.name === 'users');
  if (!usersCol) {
    const usersSchema = {
      name: 'users',
      type: 'auth',
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '',
      updateRule: 'id = @request.auth.id',
      deleteRule: 'id = @request.auth.id',
      fields: [
        { name: 'name', type: 'text', required: false },
        { name: 'avatar', type: 'file', required: false, maxSelect: 1, maxSize: 5242880 },
      ],
      authRule: '',
      manageRule: null,
      authAlert: { enabled: false },
      oauth2: { enabled: true },
      passwordAuth: { enabled: true, identityFields: ['email'] },
    };
    usersCol = await createOrUpdateCollection(token, usersSchema, existing);
  }

  // 2. Categories Collection
  const categoriesSchema = {
    name: 'categories',
    type: 'base',
    listRule: 'user = @request.auth.id',
    viewRule: 'user = @request.auth.id',
    createRule: 'user = @request.auth.id',
    updateRule: 'user = @request.auth.id',
    deleteRule: 'user = @request.auth.id',
    fields: [
      { name: 'user', type: 'relation', required: true, collectionId: usersCol.id, cascadeDelete: true, maxSelect: 1 },
      { name: 'name', type: 'text', required: true },
      { name: 'type', type: 'text', required: true }, // income | expense
      { name: 'icon', type: 'text', required: false },
      { name: 'order', type: 'number', required: false },
    ],
  };
  const categoriesCol = await createOrUpdateCollection(token, categoriesSchema, existing);

  // 3. Subcategories Collection
  const subcategoriesSchema = {
    name: 'subcategories',
    type: 'base',
    listRule: 'user = @request.auth.id',
    viewRule: 'user = @request.auth.id',
    createRule: 'user = @request.auth.id',
    updateRule: 'user = @request.auth.id',
    deleteRule: 'user = @request.auth.id',
    fields: [
      { name: 'user', type: 'relation', required: true, collectionId: usersCol.id, cascadeDelete: true, maxSelect: 1 },
      { name: 'category', type: 'relation', required: true, collectionId: categoriesCol.id, cascadeDelete: true, maxSelect: 1 },
      { name: 'name', type: 'text', required: true },
      { name: 'order', type: 'number', required: false },
    ],
  };
  const subcategoriesCol = await createOrUpdateCollection(token, subcategoriesSchema, existing);

  // 4. Accounts Collection
  const accountsSchema = {
    name: 'accounts',
    type: 'base',
    listRule: 'user = @request.auth.id',
    viewRule: 'user = @request.auth.id',
    createRule: 'user = @request.auth.id',
    updateRule: 'user = @request.auth.id',
    deleteRule: 'user = @request.auth.id',
    fields: [
      { name: 'user', type: 'relation', required: true, collectionId: usersCol.id, cascadeDelete: true, maxSelect: 1 },
      { name: 'name', type: 'text', required: true },
      { name: 'group', type: 'text', required: true },
      { name: 'amount', type: 'number', required: false },
      { name: 'description', type: 'text', required: false },
      { name: 'include_in_totals', type: 'bool', required: false },
      { name: 'is_hidden', type: 'bool', required: false },
      { name: 'order', type: 'number', required: false },
      { name: 'settlement_date', type: 'number', required: false },
      { name: 'payment_date', type: 'number', required: false },
      { name: 'linked_account', type: 'text', required: false },
    ],
  };
  const accountsCol = await createOrUpdateCollection(token, accountsSchema, existing);

  // 5. Transactions Collection
  const transactionsSchema = {
    name: 'transactions',
    type: 'base',
    listRule: 'user = @request.auth.id',
    viewRule: 'user = @request.auth.id',
    createRule: 'user = @request.auth.id',
    updateRule: 'user = @request.auth.id',
    deleteRule: 'user = @request.auth.id',
    fields: [
      { name: 'user', type: 'relation', required: true, collectionId: usersCol.id, cascadeDelete: true, maxSelect: 1 },
      { name: 'type', type: 'text', required: true },
      { name: 'date', type: 'text', required: true },
      { name: 'amount', type: 'number', required: false },
      { name: 'fee', type: 'number', required: false },
      { name: 'category', type: 'relation', required: false, collectionId: categoriesCol.id, maxSelect: 1 },
      { name: 'subcategory', type: 'relation', required: false, collectionId: subcategoriesCol.id, maxSelect: 1 },
      { name: 'from_account', type: 'relation', required: false, collectionId: accountsCol.id, maxSelect: 1 },
      { name: 'to_account', type: 'relation', required: false, collectionId: accountsCol.id, maxSelect: 1 },
      { name: 'note', type: 'text', required: false },
      { name: 'description', type: 'text', required: false },
      { name: 'photos', type: 'file', required: false, maxSelect: 5, maxSize: 5242880 },
      { name: 'is_recurring', type: 'bool', required: false },
      { name: 'recurring_rule', type: 'text', required: false },
      { name: 'is_bookmark', type: 'bool', required: false },
    ],
  };
  await createOrUpdateCollection(token, transactionsSchema, existing);

  // 6. User Preferences Collection
  const userPreferencesSchema = {
    name: 'user_preferences',
    type: 'base',
    listRule: 'user = @request.auth.id',
    viewRule: 'user = @request.auth.id',
    createRule: 'user = @request.auth.id',
    updateRule: 'user = @request.auth.id',
    deleteRule: 'user = @request.auth.id',
    fields: [
      { name: 'user', type: 'relation', required: true, collectionId: usersCol.id, cascadeDelete: true, maxSelect: 1 },
      { name: 'main_currency', type: 'text', required: true },
      { name: 'sub_currency', type: 'text', required: false },
      { name: 'sub_currency_rate', type: 'number', required: false },
      { name: 'color_scheme', type: 'text', required: true },
      { name: 'start_screen', type: 'text', required: true },
      { name: 'monthly_start_date', type: 'number', required: false },
      { name: 'weekly_start_day', type: 'text', required: true },
      { name: 'carry_over', type: 'bool', required: false },
      { name: 'enable_subcategories', type: 'bool', required: false },
      { name: 'passcode', type: 'text', required: false },
      { name: 'is_passcode_enabled', type: 'bool', required: false },
      { name: 'is_biometrics_enabled', type: 'bool', required: false },
      { name: 'time_input_mode', type: 'text', required: false },
      { name: 'show_description', type: 'bool', required: false },
      { name: 'autocomplete', type: 'bool', required: false },
      { name: 'input_order', type: 'text', required: false },
      { name: 'note_button', type: 'bool', required: false },
      { name: 'daily_reminder_time', type: 'text', required: false },
    ],
  };
  await createOrUpdateCollection(token, userPreferencesSchema, existing);

  // 7. Bookmarks Collection
  const bookmarksSchema = {
    name: 'bookmarks',
    type: 'base',
    listRule: 'user = @request.auth.id',
    viewRule: 'user = @request.auth.id',
    createRule: 'user = @request.auth.id',
    updateRule: 'user = @request.auth.id',
    deleteRule: 'user = @request.auth.id',
    fields: [
      { name: 'user', type: 'relation', required: true, collectionId: usersCol.id, cascadeDelete: true, maxSelect: 1 },
      { name: 'name', type: 'text', required: true },
      { name: 'type', type: 'text', required: true },
      { name: 'amount', type: 'number', required: false },
      { name: 'category', type: 'relation', required: false, collectionId: categoriesCol.id, maxSelect: 1 },
      { name: 'subcategory', type: 'relation', required: false, collectionId: subcategoriesCol.id, maxSelect: 1 },
      { name: 'from_account', type: 'relation', required: false, collectionId: accountsCol.id, maxSelect: 1 },
      { name: 'to_account', type: 'relation', required: false, collectionId: accountsCol.id, maxSelect: 1 },
      { name: 'note', type: 'text', required: false },
      { name: 'description', type: 'text', required: false },
    ],
  };
  await createOrUpdateCollection(token, bookmarksSchema, existing);

  // 8. Recurring Rules Collection
  const recurringRulesSchema = {
    name: 'recurring_rules',
    type: 'base',
    listRule: 'user = @request.auth.id',
    viewRule: 'user = @request.auth.id',
    createRule: 'user = @request.auth.id',
    updateRule: 'user = @request.auth.id',
    deleteRule: 'user = @request.auth.id',
    fields: [
      { name: 'user', type: 'relation', required: true, collectionId: usersCol.id, cascadeDelete: true, maxSelect: 1 },
      { name: 'type', type: 'text', required: true },
      { name: 'frequency', type: 'text', required: true },
      { name: 'timing', type: 'text', required: true },
      { name: 'start_date', type: 'text', required: true },
      { name: 'last_posted_date', type: 'text', required: false },
      { name: 'next_run_date', type: 'text', required: true },
      { name: 'amount', type: 'number', required: false },
      { name: 'fee', type: 'number', required: false },
      { name: 'category', type: 'relation', required: false, collectionId: categoriesCol.id, maxSelect: 1 },
      { name: 'subcategory', type: 'relation', required: false, collectionId: subcategoriesCol.id, maxSelect: 1 },
      { name: 'from_account', type: 'relation', required: false, collectionId: accountsCol.id, maxSelect: 1 },
      { name: 'to_account', type: 'relation', required: false, collectionId: accountsCol.id, maxSelect: 1 },
      { name: 'note', type: 'text', required: false },
      { name: 'description', type: 'text', required: false },
      { name: 'is_active', type: 'bool', required: false },
    ],
  };
  await createOrUpdateCollection(token, recurringRulesSchema, existing);

  console.log('✅ PocketBase schema initialization complete!');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  initPocketBaseSchema().catch((err) => {
    console.error('❌ Schema initialization error:', err);
    process.exit(1);
  });
}
