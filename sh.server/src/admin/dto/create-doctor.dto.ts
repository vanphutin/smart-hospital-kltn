export class CreateDoctorDto {
  email!: string;
  password!: string;
  fullName!: string;
  phone?: string;
  departmentId?: string | null;
  bio?: string | null;
  experienceYears?: number | null;
  university?: string | null;
}
