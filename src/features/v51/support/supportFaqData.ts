export type SupportFaqItem = {
  id: string;
  category: string;
  question: string;
  answer: string;
};

export const supportFaqNoResults = {
  title: "نتیجه‌ای پیدا نشد",
  text: "عبارت دیگری را جستجو کنید یا از طریق ایمیل با پشتیبانی یوزراوا در ارتباط باشید.",
  cta: "ارسال ایمیل به پشتیبانی"
} as const;

export const supportFaqItems: SupportFaqItem[] = [
  {
    id: "what-is-useravaa",
    category: "شروع کار",
    question: "یوزراوا دقیقاً برای چه کاری است؟",
    answer:
      "یوزراوا به شما کمک می‌کند قبل از تصمیم‌های مهم شغلی، با افرادی صحبت کنید که تجربه واقعی نزدیک به مسیر شما داشته‌اند. هدف این گفت‌وگوها گرفتن پاسخ آماده یا نسخه قطعی نیست؛ هدف این است که با دیدن تجربه واقعی دیگران، مسیر خود را روشن‌تر تصمیم بگیرید."
  },
  {
    id: "how-request-is-sent",
    category: "درخواست جلسه",
    question: "درخواست جلسه چه زمانی برای صاحب تجربه ارسال می‌شود؟",
    answer:
      "درخواست جلسه فقط بعد از پرداخت موفق یا ثبت نهایی درخواست جلسه رایگان برای صاحب تجربه ارسال می‌شود. تا قبل از آن، صاحب تجربه درخواستی دریافت نمی‌کند. بعد از ارسال درخواست، صاحب تجربه سه زمان پیشنهادی اعلام می‌کند و شما یکی از آن‌ها را انتخاب می‌کنید."
  },
  {
    id: "payment-does-not-confirm-session",
    category: "پرداخت و کیف پول",
    question: "آیا پرداخت یعنی جلسه قطعی شده است؟",
    answer:
      "خیر. پرداخت فقط باعث می‌شود درخواست پرداخت‌شده شما برای صاحب تجربه ارسال شود. جلسه زمانی قطعی می‌شود که صاحب تجربه سه زمان پیشنهادی اعلام کند و شما یکی از زمان‌های معتبر را انتخاب کنید."
  },
  {
    id: "held-amount",
    category: "پرداخت و کیف پول",
    question: "مبلغ پرداخت‌شده تا چه زمانی نزد یوزراوا می‌ماند؟",
    answer:
      "مبلغ پرداخت‌شده تا قطعی‌شدن و طی‌شدن روند برگزاری جلسه نزد یوزراوا نگه داشته می‌شود. جزئیات وضعیت هر درخواست یا جلسه در صفحه همان مورد نمایش داده می‌شود."
  },
  {
    id: "three-proposed-times",
    category: "زمان‌های پیشنهادی",
    question: "صاحب تجربه چند زمان پیشنهادی اعلام می‌کند؟",
    answer:
      "صاحب تجربه دقیقاً سه زمان پیشنهادی اعلام می‌کند. هر زمان شامل یک روز از تقویم شمسی و یک ساعت شروع است. شما از بین زمان‌های معتبر یکی را انتخاب می‌کنید تا جلسه قطعی شود."
  },
  {
    id: "selecting-time-no-new-payment",
    category: "زمان‌های پیشنهادی",
    question: "بعد از انتخاب زمان باید دوباره پرداخت کنم؟",
    answer:
      "خیر. اگر درخواست شما پرداخت‌شده باشد، پرداخت قبلاً انجام شده است. انتخاب یکی از زمان‌های پیشنهادی فقط جلسه را قطعی می‌کند و شما را دوباره به پرداخت یا checkout نمی‌برد."
  },
  {
    id: "attendance-verification-code",
    category: "کد تأیید برگزاری",
    question: "کد تأیید برگزاری جلسه چیست؟",
    answer:
      "برای جلسات پرداخت‌شده، بعد از قطعی‌شدن جلسه یک کد ۵ رقمی در صفحه جزئیات جلسه درخواست‌دهنده نمایش داده می‌شود. درخواست‌دهنده این کد را در شروع گفت‌وگو با تجربه‌آفرین به اشتراک می‌گذارد تا برگزاری جلسه در یوزراوا ثبت شود."
  },
  {
    id: "contact-support",
    category: "پشتیبانی",
    question: "اگر پاسخ سؤال خود را پیدا نکردم چه کار کنم؟",
    answer:
      "اگر پاسخ سؤال خود را در سوالات متداول پیدا نکردید، از طریق ایمیل Support@useravaa.ir با پشتیبانی یوزراوا در ارتباط باشید. بهتر است در ایمیل خود موضوع درخواست و توضیح کوتاهی از مسئله را بنویسید تا دقیق‌تر بررسی شود."
  }
];

export function normalizeFaqSearchQuery(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("fa-IR");
}

export function filterSupportFaqItems(items: SupportFaqItem[], query: string) {
  const normalizedQuery = normalizeFaqSearchQuery(query);

  if (!normalizedQuery) {
    return items;
  }

  return items.filter((item) => {
    const searchableText = normalizeFaqSearchQuery(`${item.question} ${item.answer} ${item.category}`);

    return searchableText.includes(normalizedQuery);
  });
}
