import { cn } from "@/lib/utils";

const variants = {
  default: "bg-muted text-muted-foreground",
  demo: "bg-muted text-muted-foreground",
  driver: "bg-primary text-primary-foreground",
  admin: "bg-accent text-accent-foreground",
};

export const Badge = ({ children, variant = "default", className }) => {
  return (
    <span className={cn("inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold", variants[variant], className)}>
      {children}
    </span>
  );
};
