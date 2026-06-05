function addStructuredData(data) {
  const script = document.createElement("script");

  script.type = "application/ld+json";
  script.textContent = JSON.stringify(data);

  document.head.appendChild(script);
}

const pagePath = window.location.pathname;

if (pagePath.includes("faq.html")) {
  addStructuredData({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How do I calculate my university grade?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "To calculate your university grade, work out each module mark first, then multiply each module mark by its credits. Add those results together and divide by the total credits. This gives your credit-weighted year average."
        }
      },
      {
        "@type": "Question",
        "name": "What is a credit-weighted average?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "A credit-weighted average means bigger modules count more towards your average. For example, a 30-credit module counts twice as much as a 15-credit module."
        }
      },
      {
        "@type": "Question",
        "name": "Do Year 2 and Year 3 count towards my final degree?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Many UK universities use Year 2 and Year 3 to calculate the final degree classification, but the exact weighting depends on the university and course. Some may use 25% for Year 2 and 75% for Year 3, while others may use 20% and 80%, or another method."
        }
      },
      {
        "@type": "Question",
        "name": "What grade do I need for a First?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "A First Class degree is usually awarded for a final average of 70% or above. However, universities may also use rules about rounding, borderline marks, credits, or final-year performance."
        }
      },
      {
        "@type": "Question",
        "name": "What grade do I need for a 2:1?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "A 2:1, also called an Upper Second Class degree, is usually awarded for a final average of 60% to 69%. Some universities may have extra borderline rules if you are close to the next classification."
        }
      },
      {
        "@type": "Question",
        "name": "Do all universities calculate grades the same way?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No. The general idea is often similar, using module marks, credits, and year weighting, but each university can have its own academic regulations. Some universities may drop the lowest credits, use different year percentages, or apply compensation and resit rules."
        }
      },
      {
        "@type": "Question",
        "name": "Are my grades saved online?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No. The calculator saves your grades in your own browser using local storage. Your module names, credits, assessment weights, and marks are not sent to a server."
        }
      },
      {
        "@type": "Question",
        "name": "Can I use this calculator for any UK university?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "You can use it as a general estimate because the calculator lets you change credits and year weightings manually. For an exact result, always check your university’s official regulations or course handbook."
        }
      },
      {
        "@type": "Question",
        "name": "What happens if I do not know my module credits?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "If you do not know your module credits, keep the same credit value for each module. This treats the modules equally. Once you find the real credit values, you can update them for a more accurate estimate."
        }
      },
      {
        "@type": "Question",
        "name": "Is this calculator official?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No. Degree Grade Tracker is an independent student tool. It is designed to help you estimate your grade, but your official result will always come from your university."
        }
      }
    ]
  });
}