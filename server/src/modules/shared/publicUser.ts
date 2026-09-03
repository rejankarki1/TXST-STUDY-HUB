/**
 * The only shape of another student this API ever returns.
 *
 * Email, password hash, refresh tokens and role are deliberately absent: no
 * screen in the product needs them, and a select list is the one place that
 * guarantee can be made once instead of in every service.
 */
export const publicUserSelect = {
  id: true,
  name: true,
  major: true,
  gradYear: true,
} as const;

export type PublicUserRow = {
  id: string;
  name: string | null;
  major: string | null;
  gradYear: number | null;
};

export type PublicUser = {
  id: string;
  name: string;
  major: string | null;
  gradYear: number | null;
};

export function toPublicUser(user: PublicUserRow): PublicUser {
  return {
    id: user.id,
    /* Every student has a name in practice, but the column is nullable and a
       card rendering "null" is worse than a generic label. */
    name: user.name ?? "Student",
    major: user.major,
    gradYear: user.gradYear,
  };
}
