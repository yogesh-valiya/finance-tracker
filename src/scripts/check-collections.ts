import PocketBase from 'pocketbase';

const PB_URL = process.env.POCKETBASE_URL || 'http://130.210.55.88:8090';
const pb = new PocketBase(PB_URL);

async function testUserAndCollections() {
  try {
    // Try to create a test user or see if users collection exists
    const testEmail = `test_${Date.now()}@example.com`;
    console.log('Testing user registration with email:', testEmail);
    const user = await pb.collection('users').create({
      email: testEmail,
      password: 'TestPassword123!',
      passwordConfirm: 'TestPassword123!',
      name: 'Test User',
    });
    console.log('User registration successful:', user.id, user.email);

    // Authenticate as this user
    await pb.collection('users').authWithPassword(testEmail, 'TestPassword123!');
    console.log('User auth successful, token:', pb.authStore.token.slice(0, 15) + '...');

    // Try testing other collections
    const collectionsToCheck = ['accounts', 'categories', 'subcategories', 'transactions', 'user_preferences', 'bookmarks', 'recurring_rules'];
    for (const colName of collectionsToCheck) {
      try {
        const list = await pb.collection(colName).getList(1, 1);
        console.log(`Collection '${colName}' exists! Items count:`, list.totalItems);
      } catch (err: any) {
        console.log(`Collection '${colName}' status/error:`, err.status, err.message);
      }
    }
  } catch (err: any) {
    console.error('Error during test:', err.status, err.message, err.data);
  }
}

testUserAndCollections();
