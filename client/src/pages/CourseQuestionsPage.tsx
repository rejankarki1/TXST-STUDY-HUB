import axios from "axios";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";

import { getCourseById } from "@/api/courses.api";
import { getCourseQuestions } from "@/api/questions.api";
import { CourseHeader } from "@/components/courses/CourseHeader";
import { SectionHeader } from "@/components/layout/SectionHeader";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/layout/StateBlock";
import { QuestionRow } from "@/components/questions/QuestionRow";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ApiErrorResponse } from "@/types/auth";
import type { Course } from "@/types/course";
import type { CourseQuestion } from "@/types/question";

const QUESTIONS_PER_PAGE = 5;

type QuestionFilter = "ALL" | "UNSOLVED" | "SOLVED";

const filters: Array<{ label: string; value: QuestionFilter }> = [
  { label: "All", value: "ALL" },
  { label: "Unsolved", value: "UNSOLVED" },
  { label: "Solved", value: "SOLVED" },
];

export function CourseQuestionsPage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [questions, setQuestions] = useState<CourseQuestion[]>([]);
  const [activeFilter, setActiveFilter] = useState<QuestionFilter>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    if (!courseId) {
      setErrorMessage("Course not found");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    Promise.all([getCourseById(courseId), getCourseQuestions(courseId)])
      .then(([courseResponse, questionsResponse]) => {
        if (!isActive) {
          return;
        }

        setCourse(courseResponse.data.course);
        setQuestions(questionsResponse.data.questions);
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        if (axios.isAxiosError<ApiErrorResponse>(error)) {
          setErrorMessage(
            error.response?.data.message ?? "Unable to load questions.",
          );
          return;
        }

        setErrorMessage("Unable to load questions.");
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [courseId]);

  const filteredQuestions = useMemo(() => {
    if (activeFilter === "SOLVED") {
      return questions.filter((question) => question.status === "RESOLVED");
    }

    if (activeFilter === "UNSOLVED") {
      return questions.filter((question) => question.status !== "RESOLVED");
    }

    return questions;
  }, [activeFilter, questions]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredQuestions.length / QUESTIONS_PER_PAGE),
  );

  const pagedQuestions = filteredQuestions.slice(
    (currentPage - 1) * QUESTIONS_PER_PAGE,
    currentPage * QUESTIONS_PER_PAGE,
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  function onFilterChange(filter: QuestionFilter) {
    setActiveFilter(filter);
    setCurrentPage(1);
  }

  if (isLoading) {
    return <LoadingState label="Loading questions..." />;
  }

  if (errorMessage || !course) {
    return <ErrorState message={errorMessage ?? "Course not found"} />;
  }

  const askQuestionAction = (
    <Button asChild>
      <Link to={`/courses/${course.id}/questions/new`}>
        <Plus className="size-4" aria-hidden="true" />
        Ask Question
      </Link>
    </Button>
  );

  return (
    <div className="space-y-8">
      <CourseHeader course={course} />

      <section>
        <SectionHeader
          title="Questions"
          description="Ask and answer questions about this course."
          action={askQuestionAction}
        />

        <div className="mb-6 flex gap-2">
          {filters.map((filter) => {
            const isActive = filter.value === activeFilter;

            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => onFilterChange(filter.value)}
                className={cn(
                  "rounded-full border px-4 py-2 text-xs font-semibold transition-colors",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-primary",
                )}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          {pagedQuestions.length === 0 ? (
            <EmptyState
              title={
                questions.length === 0
                  ? "No questions yet."
                  : "No questions match this filter."
              }
              description={
                questions.length === 0
                  ? `Be the first to ask something about ${course.code}.`
                  : "Try a different question status."
              }
              action={questions.length === 0 ? askQuestionAction : undefined}
            />
          ) : null}

          {pagedQuestions.map((question) => (
            <QuestionRow key={question.id} question={question} />
          ))}
        </div>

        {totalPages > 1 ? (
          <nav
            className="mt-10 flex items-center justify-center gap-4"
            aria-label="Question pages"
          >
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </Button>

            <div className="flex gap-2">
              {Array.from({ length: totalPages }).map((_, index) => {
                const pageNumber = index + 1;
                const isActive = pageNumber === currentPage;

                return (
                  <Button
                    key={pageNumber}
                    type="button"
                    variant={isActive ? "default" : "outline"}
                    size="icon"
                    onClick={() => setCurrentPage(pageNumber)}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {pageNumber}
                  </Button>
                );
              })}
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          </nav>
        ) : null}
      </section>
    </div>
  );
}
