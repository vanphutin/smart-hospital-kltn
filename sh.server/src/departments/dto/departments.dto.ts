export class CreateDepartmentDto {
  name!: string;
  description?: string | null;
}

export class UpdateDepartmentDto {
  name?: string;
  description?: string | null;
}
