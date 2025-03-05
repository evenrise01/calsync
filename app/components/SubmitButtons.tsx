"use client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useFormStatus } from "react-dom";
import GoogleLogo from "@/public/google.svg";
import GithubLogo from "@/public/github.svg";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Interface defining props for customizable submit buttons
// Provides type safety and flexibility for button configuration
interface ButtonProps {
  text: string;             // Text to display on the button
  variant?:                 // Optional button style variant
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | null
    | undefined;

  className?: string;       // Additional CSS classes for custom styling
}

// Generic Submit Button Component
// Handles different states (idle and pending) with dynamic rendering
export function SubmitButton({ text, variant, className }: ButtonProps) {
  // Hook to track form submission status
  const { pending } = useFormStatus();

  return (
    <>
      {/* Conditional rendering based on form submission state */}
      {pending ? (
        // Disabled state during form submission
        <Button disabled variant="outline" className={cn("w-fit", className)}>
          {/* Spinning loader icon to indicate processing */}
          <Loader2 className="size-4 mr-2 animate-spin" /> Please wait...
        </Button>
      ) : (
        // Default button state when not submitting
        <Button type="submit" variant={variant} className={cn("w-fit", className)}>
          {text}
        </Button>
      )}
    </>
  );
}

// Specialized Google Authentication Button
// Provides a consistent authentication experience with visual feedback
export function GoogleAuthButton() {
  // Track form submission status for dynamic rendering
  const { pending } = useFormStatus();

  return (
    <>
      {pending ? (
        // Disabled state during Google authentication
        <Button disabled variant={"outline"} className="w-full">
          {/* Animated loading indicator */}
          <Loader2 className="size-4 mr-2 animate-spin" /> Please Wait
        </Button>
      ) : (
        // Default button state with Google logo
        <Button variant={"outline"} className="w-full">
          {/* Google logo with specific sizing */}
          <Image src={GoogleLogo} alt="Google logo" className="size-4 mr-2" />
          Sign in with Google
        </Button>
      )}
    </>
  );
}

// Specialized GitHub Authentication Button
// Similar structure to GoogleAuthButton with GitHub-specific branding
export function GithubAuthButton() {
  // Track form submission status for dynamic rendering
  const { pending } = useFormStatus();

  return (
    <>
      {pending ? (
        // Disabled state during GitHub authentication
        <Button disabled variant={"outline"} className="w-full">
          {/* Animated loading indicator */}
          <Loader2 className="size-4 mr-2 animate-spin" /> Please Wait
        </Button>
      ) : (
        // Default button state with GitHub logo
        <Button variant={"outline"} className="w-full">
          {/* GitHub logo with specific sizing */}
          <Image src={GithubLogo} alt="Github logo" className="size-4 mr-2" />
          Sign in with Github
        </Button>
      )}
    </>
  );
}