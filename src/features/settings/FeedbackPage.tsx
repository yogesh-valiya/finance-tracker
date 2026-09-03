import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Star, Send, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export const FeedbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState('Feature Request');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error('Please enter your feedback message');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      toast.success('Thank you! Your feedback has been received.');
      setIsSubmitting(false);
      navigate('/more');
    }, 500);
  };

  const CATEGORIES = ['Feature Request', 'Bug Report', 'Design & UX', 'General'];

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
              Send Feedback
            </h1>
            <p className="text-[10px] text-muted-foreground">
              Help us improve your personal finance experience
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Rating Card */}
        <Card className="border-border/60 bg-card shadow-2xs">
          <CardContent className="flex flex-col items-center gap-2.5 p-4 text-center">
            <span className="text-xs font-semibold text-foreground">
              How would you rate your experience?
            </span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Button
                  key={star}
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setRating(star)}
                  className="size-8 p-0 transition-transform active:scale-90 hover:bg-muted/50"
                  aria-label={`Rate ${star} star`}
                >
                  <Star
                    className={`size-5 ${
                      star <= rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-muted-foreground/40'
                    }`}
                  />
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Selector */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-semibold text-foreground">
            Feedback Type
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat}
                type="button"
                variant={category === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategory(cat)}
                className="h-8 text-xs font-semibold"
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Message Input */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="msg" className="text-xs font-semibold text-foreground">
            Your Thoughts & Suggestions
          </Label>
          <textarea
            id="msg"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us what you love or what we can do better..."
            className="w-full rounded-xl border border-border/60 bg-card p-3 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-2xs"
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-9 gap-1.5 text-xs font-semibold"
        >
          <Send className="size-3.5" />
          {isSubmitting ? 'Sending...' : 'Submit Feedback'}
        </Button>
      </form>
    </div>
  );
};
