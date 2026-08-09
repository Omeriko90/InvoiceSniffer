import React from "react";
import {
  FieldValues,
  useForm,
  FormProvider,
  DefaultValues,
  Resolver,
} from "react-hook-form";
import { ZodSchema } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

function BaseForm<T extends FieldValues>({
  children,
  onSubmit,
  defaultValues,
  className,
  schema,
  id,
}: BaseFormProps<T>) {
  const { handleSubmit, ...methods } = useForm<T>({
    defaultValues,
    // `schema` is the generic `ZodSchema<T>`, whose zod v4 `_input` type is
    // `unknown` and so doesn't satisfy zodResolver's `FieldValues` input bound.
    // In a generic form wrapper the schema can't be tied to `T` structurally,
    // so cast the argument and pin the result to the form's `Resolver<T>`.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any) as Resolver<T>,
    reValidateMode: "onChange",
  });

  return (
    <FormProvider {...methods} handleSubmit={handleSubmit}>
      <form onSubmit={handleSubmit(onSubmit)} className={className} id={id}>
        {children}
      </form>
    </FormProvider>
  );
}

export type BaseFormProps<T extends FieldValues> = {
  children: React.ReactNode;
  onSubmit: (values: T) => void | Promise<void>;
  defaultValues?: DefaultValues<T>;
  className?: string;
  schema: ZodSchema<T>;
  id?: string;
};

export { BaseForm };