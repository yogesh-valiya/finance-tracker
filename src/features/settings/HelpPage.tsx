import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ArrowLeft, Search, HelpCircle, BookOpen } from 'lucide-react';

const FAQS = [
  {
    id: 'double-entry',
    question: 'How does Double-Entry Bookkeeping work?',
    answer:
      'Every transaction affects your ledger balances precisely. Income increases an asset account balance. Expenses decrease an account balance. Internal Transfers move funds from one account (e.g. Salary Bank) to another (e.g. Cash or Credit Card) without affecting your total Net Worth.',
  },
  {
    id: 'credit-cards',
    question: 'How do Credit Card liabilities & settlements work?',
    answer:
      'When you make a purchase with a credit card, record it as an Expense from your Credit Card account (which increases your liability). When you pay your credit card bill at the end of the month, record it as a Transfer from your Bank Account to your Credit Card account. This clears the liability with zero floating point drift.',
  },
  {
    id: 'color-schemes',
    question: 'What is the difference between Set A and Set B?',
    answer:
      'Set A uses Sky Blue for Income and Coral Red for Expenses (Western financial standard). Set B uses Coral Red for Income and Sky Blue for Expenses (traditional East Asian market charting). You can toggle this anytime in More > Configuration > General.',
  },
  {
    id: 'billing-cycle',
    question: 'How do custom monthly billing cycles work?',
    answer:
      'If your salary or credit card cycle starts on the 25th of each month, set "Monthly Start Date" to 25. The app dynamically computes your periods (e.g. 25 Aug ~ 24 Sept) across all transaction feeds and analytics charts.',
  },
  {
    id: 'calculator-keypad',
    question: 'How do equations work in the numeric keypad?',
    answer:
      'You can type mathematical expressions directly into the amount numpad (such as "250 + 50 * 2" or "(1200 / 3) - 50"). The app uses a deterministic expression parser to evaluate the exact result without using eval().',
  },
];

export const HelpPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filteredFaqs = FAQS.filter(
    (f) =>
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4 p-4 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => navigate('/more')}
            className="text-muted-foreground hover:text-foreground -ml-2"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-base font-bold text-foreground leading-tight">
              Help & FAQ
            </h1>
            <p className="text-[10px] text-muted-foreground">
              Bookkeeping rules, formulas & user guide
            </p>
          </div>
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
        <Input
          placeholder="Search questions or topics..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8.5 pl-8 text-xs bg-card border-border/60"
        />
      </div>

      {/* Accordion List */}
      <div className="flex flex-col rounded-xl border border-border/60 bg-card overflow-hidden shadow-2xs">
        <Accordion type="single" collapsible className="w-full">
          {filteredFaqs.map((faq) => (
            <AccordionItem key={faq.id} value={faq.id} className="px-3.5 border-border/40">
              <AccordionTrigger className="text-xs font-semibold hover:no-underline text-foreground py-3 text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-[11px] text-muted-foreground leading-relaxed pb-3.5">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
};
