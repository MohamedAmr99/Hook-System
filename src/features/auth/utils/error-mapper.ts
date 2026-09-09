export function mapAuthError(error: any): string {
  const code = error?.code || "";
  switch (code) {
    case "auth/email-already-in-use":
      return "This email is already registered.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Invalid email or password.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many failed login attempts. Please try again later.";
    default:
      return error?.message || "An unexpected error occurred. Please try again.";
  }
}
