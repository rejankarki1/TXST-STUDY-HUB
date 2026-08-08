import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router";

import {
  acceptAnswer,
  createAnswer,
  getQuestionById,
} from "../api/questions.api.ts";
import { useAuth } from "../hooks/useAuth.ts";
import {
  answerFormSchema,
  type AnswerFormValues,
} from "../schemas/question.schema.ts";
import type { ApiErrorResponse } from "../types/auth.ts";
import type { QuestionDetails } from "../types/question.ts";

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function QuestionDetailsPage() {
  const { questionId } = useParams();
  const { isAuthenticated, user } = useAuth();
  const [question, setQuestion] = useState<QuestionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [acceptingAnswerId, setAcceptingAnswerId] = useState<string | null>(
    null,
  );

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<AnswerFormValues>({
    resolver: zodResolver(answerFormSchema),
    defaultValues: {
      body: "",
    },
  });

  const loadQuestion = useCallback(async () => {
    if (!questionId) {
      setErrorMessage("Question not found");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      const response = await getQuestionById(questionId);
      setQuestion(response.data.question);
    } catch (error) {
      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        setErrorMessage(
          error.response?.data.message ?? "Unable to load question.",
        );
        return;
      }

      setErrorMessage("Unable to load question.");
    } finally {
      setIsLoading(false);
    }
  }, [questionId]);

  useEffect(() => {
    void loadQuestion();
  }, [loadQuestion]);

  async function onSubmit(values: AnswerFormValues) {
    if (!questionId) {
      return;
    }

    try {
      setAnswerError(null);
      await createAnswer(questionId, values);
      reset();
      await loadQuestion();
    } catch (error) {
      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        setAnswerError(error.response?.data.message ?? "Unable to post answer.");
        return;
      }

      setAnswerError("Unable to post answer.");
    }
  }

  async function onAcceptAnswer(answerId: string) {
    if (!questionId) {
      return;
    }

    try {
      setAnswerError(null);
      setAcceptingAnswerId(answerId);
      const response = await acceptAnswer(questionId, answerId);
      setQuestion(response.data.question);
    } catch (error) {
      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        setAnswerError(
          error.response?.data.message ?? "Unable to accept answer.",
        );
        return;
      }

      setAnswerError("Unable to accept answer.");
    } finally {
      setAcceptingAnswerId(null);
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
        Loading question...
      </section>
    );
  }

  if (errorMessage || !question) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">
          {errorMessage ?? "Question not found"}
        </h1>
        <Link
          to="/courses"
          className="mt-6 inline-flex rounded-md bg-red-900 px-4 py-2 font-semibold text-white hover:bg-red-950"
        >
          Back to Courses
        </Link>
      </section>
    );
  }

  const isQuestionAuthor = user?.id === question.author.id;
  const isResolved = question.status === "RESOLVED";

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <Link
          to={`/courses/${question.course.id}`}
          className="text-sm font-medium text-red-900 hover:underline"
        >
          Back to {question.course.code}
        </Link>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {question.title}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {question.course.code} • Asked by{" "}
              {question.author.name ?? question.author.email} •{" "}
              {formatDate(question.createdAt)}
            </p>
          </div>
          <span
            className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ${
              isResolved
                ? "bg-green-100 text-green-800"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {isResolved ? "Solved" : "Open"}
          </span>
        </div>

        <p className="mt-6 whitespace-pre-wrap leading-7 text-slate-700">
          {question.body}
        </p>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">
          {question.answers.length}{" "}
          {question.answers.length === 1 ? "Answer" : "Answers"}
        </h2>

        {answerError ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {answerError}
          </div>
        ) : null}

        <div className="mt-5 space-y-4">
          {question.answers.length === 0 ? (
            <p className="text-sm text-slate-600">No answers yet.</p>
          ) : null}

          {question.answers.map((answer) => {
            const isAccepted = question.acceptedAnswerId === answer.id;
            const canAccept =
              isQuestionAuthor && !isResolved && question.answers.length > 0;

            return (
              <article
                key={answer.id}
                className={`rounded-lg border p-4 ${
                  isAccepted
                    ? "border-green-300 bg-green-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <p className="text-sm text-slate-600">
                    {answer.author.name ?? answer.author.email} •{" "}
                    {formatDate(answer.createdAt)}
                  </p>
                  {isAccepted ? (
                    <span className="w-fit rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
                      Accepted Answer
                    </span>
                  ) : null}
                </div>

                <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-700">
                  {answer.body}
                </p>

                {canAccept ? (
                  <button
                    type="button"
                    onClick={() => void onAcceptAnswer(answer.id)}
                    disabled={acceptingAnswerId === answer.id}
                    className="mt-4 rounded-md border border-green-700 px-3 py-2 text-sm font-semibold text-green-800 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {acceptingAnswerId === answer.id
                      ? "Accepting..."
                      : "Accept Answer"}
                  </button>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Your Answer</h2>

        {isAuthenticated ? (
          <form
            onSubmit={(event) => void handleSubmit(onSubmit)(event)}
            className="mt-4"
          >
            <label htmlFor="body" className="text-sm font-medium text-slate-700">
              Answer
            </label>
            <textarea
              id="body"
              rows={7}
              {...register("body")}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-red-900 focus:ring-2 focus:ring-red-900/20"
            />
            {errors.body ? (
              <p className="mt-1 text-sm text-red-700">{errors.body.message}</p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-4 rounded-md bg-red-900 px-4 py-2 font-semibold text-white hover:bg-red-950 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Posting..." : "Post Answer"}
            </button>
          </form>
        ) : (
          <p className="mt-3 text-slate-600">
            <Link
              to="/login"
              className="font-medium text-red-900 hover:underline"
            >
              Log in
            </Link>{" "}
            to post an answer.
          </p>
        )}
      </section>
    </div>
  );
}
