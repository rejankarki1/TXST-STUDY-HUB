export type Department = {
  id: string;
  code: string;
  name: string;
};

export type DepartmentsResponse = {
  success: true;
  data: {
    departments: Department[];
  };
};
