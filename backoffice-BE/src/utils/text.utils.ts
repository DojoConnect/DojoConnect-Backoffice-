export const getFullName = (firstName: string, lastName: string | null) => {
  return `${firstName} ${lastName || ""}`.trim();
};
