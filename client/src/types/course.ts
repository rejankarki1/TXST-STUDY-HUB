export type Course = {
  id: string;
  code: string;
  title: string;
  description: string | null;
};

export type CoursesResponse = {
  success: true;
  data: {
    courses: Course[];
  };
};

export type CourseResponse = {
  success: true;
  data: {
    course: Course;
  };
};
