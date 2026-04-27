import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface Props {
  to: string;
  label?: string;
}

const OnboardingBackButton = ({ to, label = "Back" }: Props) => (
  <Button
    asChild
    variant="ghost"
    size="sm"
    className="text-muted-foreground hover:text-foreground -ml-2 w-fit"
  >
    <Link to={to}>
      <ArrowLeft className="w-4 h-4 mr-1" /> {label}
    </Link>
  </Button>
);

export default OnboardingBackButton;
