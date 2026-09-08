import { createFileRoute } from "@tanstack/react-router";
import { SpoonfulApp } from "@/components/spoonful-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <SpoonfulApp />;
}
