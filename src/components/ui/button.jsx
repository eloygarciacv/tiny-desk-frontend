import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cn } from "cn";
import { buttonVariants } from "./button-variants";

function Button({
  className,
  variant = "default",
  size = "default",
  render,
  ...props
}) {
  return (
    <ButtonPrimitive
      data-slot="button"
      nativeButton={render ? false : undefined}
      render={render}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button };
