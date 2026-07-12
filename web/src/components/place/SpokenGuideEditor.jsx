import { Headphones, Plus, Trash2, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const MAX_FAQS = 5;
const EMPTY_GUIDE = Object.freeze({ locale: "vi-VN", text: "", faqs: [] });

export default function SpokenGuideEditor({ value = EMPTY_GUIDE, onChange }) {
  const guide = {
    locale: value?.locale || "vi-VN",
    text: value?.text || "",
    faqs: Array.isArray(value?.faqs) ? value.faqs : [],
  };

  const updateFaq = (index, field, nextValue) => {
    const faqs = guide.faqs.map((faq, faqIndex) =>
      faqIndex === index ? { ...faq, [field]: nextValue } : faq,
    );
    onChange({ ...guide, faqs });
  };

  const addFaq = () => {
    if (guide.faqs.length >= MAX_FAQS) return;
    onChange({
      ...guide,
      faqs: [...guide.faqs, { question: "", answer: "" }],
    });
  };

  const removeFaq = (index) => {
    onChange({
      ...guide,
      faqs: guide.faqs.filter((_, faqIndex) => faqIndex !== index),
    });
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-cyan-100 bg-white">
      <div className="flex items-start gap-3 border-b border-cyan-100 bg-cyan-50/60 px-4 py-4 sm:px-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-600 text-white shadow-sm shadow-cyan-600/20">
          <Headphones className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="font-semibold text-zinc-950">Thuyết minh địa điểm</h3>
          <p className="mt-0.5 text-sm leading-5 text-zinc-600">
            Người dùng có thể nghe bài giới thiệu và câu trả lời bằng giọng đọc trên thiết bị.
          </p>
        </div>
      </div>

      <div className="space-y-6 p-4 sm:p-5">
        <div className="space-y-2">
          <div className="flex items-end justify-between gap-3">
            <Label htmlFor="spoken-guide-text">Bài giới thiệu chi tiết</Label>
            <span className="text-xs tabular-nums text-zinc-500">
              {guide.text.length}/5.000
            </span>
          </div>
          <Textarea
            id="spoken-guide-text"
            value={guide.text}
            maxLength={5000}
            rows={8}
            placeholder="Viết như một hướng dẫn viên địa phương: điều gì đáng chú ý, nên trải nghiệm gì và những lưu ý cần biết..."
            onChange={(event) => onChange({ ...guide, text: event.target.value })}
            className="min-h-44 resize-y rounded-xl border-zinc-200 bg-zinc-50/70 p-4 leading-6 focus-visible:bg-white"
          />
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 font-semibold text-zinc-950">
                <Volume2 className="h-4 w-4 text-cyan-700" aria-hidden="true" />
                Câu hỏi thường gặp
              </div>
              <p className="mt-1 text-xs text-zinc-500">Tối đa 5 câu, hiển thị theo đúng thứ tự bên dưới.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addFaq}
              disabled={guide.faqs.length >= MAX_FAQS}
              className="gap-2 rounded-xl"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Thêm câu hỏi
            </Button>
          </div>

          {guide.faqs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 px-4 py-5 text-center text-sm text-zinc-500">
              Chưa có câu hỏi thường gặp.
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200">
              {guide.faqs.map((faq, index) => (
                <div key={index} className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase text-zinc-500">
                      Câu {index + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Xóa câu hỏi ${index + 1}`}
                      onClick={() => removeFaq(index)}
                      className="h-9 w-9 rounded-lg text-zinc-500 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`spoken-guide-question-${index}`}>Câu hỏi thường gặp {index + 1}</Label>
                    <Textarea
                      id={`spoken-guide-question-${index}`}
                      aria-label={`Câu hỏi thường gặp ${index + 1}`}
                      value={faq.question || ""}
                      maxLength={200}
                      rows={2}
                      onChange={(event) => updateFaq(index, "question", event.target.value)}
                      className="resize-none rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`spoken-guide-answer-${index}`}>Câu trả lời</Label>
                    <Textarea
                      id={`spoken-guide-answer-${index}`}
                      value={faq.answer || ""}
                      maxLength={2000}
                      rows={4}
                      onChange={(event) => updateFaq(index, "answer", event.target.value)}
                      className="resize-y rounded-xl"
                    />
                    <p className="text-right text-xs tabular-nums text-zinc-500">
                      {(faq.answer || "").length}/2.000
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
