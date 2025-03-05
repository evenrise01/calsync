import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTrigger } from "@/components/ui/dialog";
import Logo from '@/public/logo.png'
import Image from "next/image";
import { signIn } from "../lib/auth";
import { GithubAuthButton, GoogleAuthButton } from "./SubmitButtons";

// AuthModal: A reusable authentication dialog component for user sign-in
export function AuthModal() {
    return(
        // Dialog component provides a modal interface for authentication
        <Dialog>
            {/* DialogTrigger wraps the button that opens the modal */}
            <DialogTrigger asChild>
                <Button>Try for free</Button>
            </DialogTrigger>

            {/* DialogContent defines the modal's interior layout and content */}
            <DialogContent className="sm:max-w-[360px]">
                {/* DialogHeader contains the logo and application name */}
                <DialogHeader className="flex flex-row justify-center items-center gap-2">
                    {/* Logo image with responsive sizing */}
                    <Image src={Logo} alt="logo" className="size-10"/>
                    
                    {/* Application name with highlighted branding */}
                    <h4 className="text-3xl font-semibold">
                        Cal<span className="text-primary">Sync</span>
                    </h4>
                </DialogHeader>

                {/* Container for authentication method buttons */}
                <div className="flex flex-col mt-5 gap-4">
                    {/* Google Sign-In Form */}
                    <form 
                        // Server-side action for Google authentication
                        action={async() => {
                            "use server"
                            // Initiate Google sign-in process
                            await signIn("google")
                        }}
                        className="w-full"
                    >
                        {/* Reusable Google authentication button component */}
                        <GoogleAuthButton/>
                    </form>

                    {/* GitHub Sign-In Form */}
                    <form 
                        // Server-side action for GitHub authentication
                        action={async() => {
                            "use server"
                            // Initiate GitHub sign-in process
                            await signIn("github")
                        }}
                        className="w-full"
                    >
                        {/* Reusable GitHub authentication button component */}
                        <GithubAuthButton/>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    )
}