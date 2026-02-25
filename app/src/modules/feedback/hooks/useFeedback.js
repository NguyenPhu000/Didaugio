import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { submitFeedbackApi } from "../api/feedbackApi";

export const useFeedback = () => {
  const [reportType, setReportType] = useState("suggestion");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const mutation = useMutation({
    mutationFn: () => submitFeedbackApi({ reportType, title, content }),
  });

  const canSubmit = reportType.trim() && title.trim() && content.trim();

  const reset = () => {
    setReportType("suggestion");
    setTitle("");
    setContent("");
  };

  return {
    reportType,
    setReportType,
    title,
    setTitle,
    content,
    setContent,
    canSubmit,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    submit: mutation.mutate,
    reset,
  };
};
