import {
  CloudLightning,
  CloudRain,
  Lock,
  LucideBookDashed,
  LucideBookHeart,
} from "lucide-react";

const features = [
  {
    name: "Sign up for free",
    description: "You can sign-up for free using Google or Github.",
    icon: CloudRain,
  },
  {
    name: "Blazing Fast",
    description: "Schedule meetings fast and effectively",
    icon: CloudLightning,
  },
  {
    name: "Easy to use",
    description: "Minimal and easy to use UI to not get lost",
    icon: LucideBookHeart,
  },
  {
    name: "Super Secure with Nylas",
    description: "Your calendar information is highly secured with Nylas",
    icon: Lock,
  },
];

export function Features() {
  return (
    <div className="py-24">
      <div className="max-w-2xl mx-auto lg:text-center">
        <p className="font-semibold leading-7 text-primary">Schedule faster</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Schedule meetings in minutes
        </h1>
        <p className="mt-6 text-base leading-snug text-muted-foreground">
          With CalSync, you can schedule meetings in minutes. We make it easier
          for your clients to see your availaibility and schedule meetings with
          you according to your preferences.
        </p>
      </div>
      <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
        <div className="grid max-w-xl gap-y-10 gap-x-8 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
          {features.map((feature, index) => (
            <div key={index} className="relative pl-16">
              <div className="text-base font-medium leading-7">
                <div className="absolute left-0 top-0 flex size-10 items-center justify-center rounded-lg bg-primary">
                    <feature.icon className="size-6 text-white"/>
                </div>
                {feature.name}
              </div>
              <p className="mt-2 text-sm text-muted-foreground leading-snug">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
