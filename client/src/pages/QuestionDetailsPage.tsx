import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Link, useParams } from "react-router";

import {
  acceptAnswer,
  createAnswer,
  getQuestionById,
} from "../api/questions.api.ts";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "../hooks/useAuth.ts";
import { formatDate } from "@/lib/format";
import {
  answerFormSchema,
  type AnswerFormValues,
} from "../schemas/question.schema.ts";
import type { ApiErrorResponse } from "../types/auth.ts";
import type { QuestionDetails } from "../types/question.ts";

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
      <Card>
        <CardContent className="p-6 text-muted-foreground">
          Loading question...
        </CardContent>
      </Card>
    );
  }

  if (errorMessage || !question) {
    return (
      <Card>
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold text-foreground">
            {errorMessage ?? "Question not found"}
          </h1>
          <Button asChild className="mt-6">
            <Link to="/courses">Back to Courses</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isQuestionAuthor = user?.id === question.author.id;
  const isResolved = question.status === "RESOLVED";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <Link
          to={`/courses/${question.course.id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to {question.course.code}
        </Link>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge variant="outline" className="text-primary">
                {question.course.code}
              </Badge>
              <Badge variant={isResolved ? "success" : "secondary"}>
                {isResolved ? "Solved" : "Open"}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {question.title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Asked by{" "}
              {question.author.name ?? question.author.email} •{" "}
              {formatDate(question.createdAt)}
            </p>
          </div>
        </div>

        <p className="mt-6 whitespace-pre-wrap leading-7 text-foreground">
          {question.body}
        </p>
      </section>

      <Card className="border-neutral-200 shadow-none">
        <CardHeader>
          <CardTitle>
            {question.answers.length}{" "}
            {question.answers.length === 1 ? "Answer" : "Answers"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {answerError ? (
            <Alert variant="destructive" className="mb-4">
              {answerError}
            </Alert>
          ) : null}

          <div className="space-y-4">
            {question.answers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No answers yet.</p>
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
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-border bg-card"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                      {answer.author.name ?? answer.author.email} •{" "}
                      {formatDate(answer.createdAt)}
                    </p>
                    {isAccepted ? (
                      <Badge variant="success">
                        <CheckCircle2 className="mr-1 size-3" aria-hidden="true" />
                        Accepted Answer
                      </Badge>
                    ) : null}
                  </div>

                  <p className="mt-3 whitespace-pre-wrap leading-7 text-foreground">
                    {answer.body}
                  </p>

                  {canAccept ? (
                    <Button
                      type="button"
                      onClick={() => void onAcceptAnswer(answer.id)}
                      disabled={acceptingAnswerId === answer.id}
                      variant="success"
                      size="sm"
                      className="mt-4"
                    >
                      {acceptingAnswerId === answer.id
                        ? "Accepting..."
                        : "Accept Answer"}
                    </Button>
                  ) : null}
                </article>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-neutral-200 shadow-none">
        <CardHeader>
          <CardTitle>Your Answer</CardTitle>
        </CardHeader>
        <CardContent>
          {isAuthenticated ? (
            <form
              onSubmit={(event) => void handleSubmit(onSubmit)(event)}
              className="mt-4"
            >
              <label
                htmlFor="body"
                className="text-sm font-semibold text-foreground"
              >
                Answer
              </label>
              <Textarea
                id="body"
                rows={7}
                {...register("body")}
                className="mt-1"
              />
              {errors.body ? (
                <p className="mt-1 text-sm text-destructive">
                  {errors.body.message}
                </p>
              ) : null}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="mt-4 bg-primary hover:bg-primary/90"
              >
                {isSubmitting ? "Posting..." : "Post Answer"}
              </Button>
            </form>
          ) : (
            <p className="text-muted-foreground">
              <Link
                to="/login"
                className="font-semibold text-primary hover:underline"
              >
                Log in
              </Link>{" "}
              to post an answer.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
