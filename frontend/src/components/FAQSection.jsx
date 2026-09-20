import React, { useState } from 'react';
import { FiChevronDown, FiHelpCircle } from 'react-icons/fi';
import { trackEvent } from '../utils/analytics';

const FAQSection = ({ onOpenApplication }) => {
  const [openIdx, setOpenIdx] = useState(0);

  const faqs = [
    {
      question: 'Do customers need to install an app?',
      answer: 'No. Customers can scan the QR code using their built-in smartphone camera and access the digital menu directly from their mobile browser.'
    },
    {
      question: 'Can I update my menu?',
      answer: 'Yes. Restaurant owners can log into their dashboard at any time to add items, change prices, edit descriptions, upload photos, or toggle item availability in real time.'
    },
    {
      question: 'Can every table have a different QR code?',
      answer: 'Yes. You can generate unique QR codes for individual tables so orders arrive with exact table numbers attached.'
    },
    {
      question: 'Can restaurants receive live orders?',
      answer: 'Yes. Incoming orders appear instantly on your restaurant dashboard with audio alerts, table numbers, item lists, and customer notes.'
    },
    {
      question: 'Does QR Menu work on mobile?',
      answer: 'Yes. The customer ordering experience is designed primarily for smartphones, ensuring fast load times and clean touch controls.'
    },
    {
      question: 'How can I get started?',
      answer: 'Simply submit the restaurant application form on this website. Our team will review your details, set up your account, and guide you through onboarding.'
    }
  ];

  const toggleFAQ = (idx) => {
    if (openIdx === idx) {
      setOpenIdx(null);
    } else {
      setOpenIdx(idx);
      trackEvent('FAQ Opened', { question: faqs[idx].question });
    }
  };

  return (
    <section id="faq" className="py-20 bg-[#0B0F19] relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold uppercase">
            <FiHelpCircle /> Got Questions?
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-base text-gray-400">
            Everything you need to know about setting up QR Menu for your business.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="glass-card rounded-xl border-purple-900/20 overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => toggleFAQ(idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-white hover:text-purple-300 transition-colors cursor-pointer"
                >
                  <span className="text-base md:text-lg">{faq.question}</span>
                  <FiChevronDown
                    className={`text-xl text-purple-400 shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-sm text-gray-300 leading-relaxed border-t border-white/5 pt-4">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center p-6 rounded-2xl bg-gradient-to-r from-purple-900/20 via-indigo-900/10 to-purple-900/20 border border-purple-500/20">
          <p className="text-sm text-gray-300">
            Have more questions about digital QR menu implementation?
          </p>
          <button
            onClick={onOpenApplication}
            className="mt-3 btn-outline text-xs py-2 px-5 font-semibold text-purple-300 border-purple-500/30 hover:border-purple-400"
          >
            Apply & Speak With Our Team
          </button>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
