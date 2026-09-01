import { useState } from 'react'

const faqs = [
  {
    question: 'When does YAYEX launch?',
    answer: 'We\'re targeting Q1-Q2 2027. Private beta with founding traders starting sooner. Join the waitlist to get early access.'
  },
  {
    question: 'Is this real money or paper trading?',
    answer: 'MVP launches with paper trading (simulated). This means zero risk while you learn. We\'ll expand to real money challenges in Phase 2 based on demand.'
  },
  {
    question: 'What\'s the difference between fixed and trailing drawdown?',
    answer: 'With fixed drawdown, your max loss is set (e.g., 10% of your starting capital). No surprise stop-outs. Trailing drawdown resets as you profit, but can feel arbitrary.'
  },
  {
    question: 'Do I need prior trading experience?',
    answer: 'We welcome all levels. But we\'re built for traders with 2+ years of experience who understand risk management.'
  },
  {
    question: 'Why Georgian jurisdiction?',
    answer: 'Georgia is crypto-friendly, has favorable taxation for fintech, and no complex regulatory hurdles for prop trading.'
  },
  {
    question: 'What\'s the cost?',
    answer: 'Starter challenge: €49 entry. AI Psychologist addon: €9/month. AI Coach addon: €19/month later. Transparent pricing, no hidden fees.'
  }
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="faq" id="faq">
      <h2>FAQ</h2>
      <div className="faq-container">
        {faqs.map((faq, index) => (
          <div key={index} className="faq-item">
            <h4 onClick={() => setOpenIndex(openIndex === index ? null : index)}>
              {faq.question}
              <span className="toggle">{openIndex === index ? '−' : '+'}</span>
            </h4>
            {openIndex === index && <p>{faq.answer}</p>}
          </div>
        ))}
      </div>
    </section>
  )
}