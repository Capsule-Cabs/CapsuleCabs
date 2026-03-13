import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "bg-white text-black border border-zinc-200 shadow-lg rounded-xl",
          title: "text-black font-semibold",
          description: "text-zinc-700",
          actionButton: "bg-black text-white",
          cancelButton: "bg-zinc-100 text-black",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }