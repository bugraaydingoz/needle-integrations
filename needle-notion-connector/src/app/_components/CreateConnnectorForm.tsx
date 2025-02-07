"use client";

import { api } from "~/trpc/react";
import { type Collection } from "@needle-ai/needle-sdk";
import { useRouter } from "next/navigation";
import type {
  DatabaseObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";
import {
  NotionConnectorPreview,
  type NotionPreviewData,
} from "./NotionConnectorPreview";
import { type NotionToken } from "~/models/notion-models";
import { Controller, useForm } from "react-hook-form";
import { Button } from "./atoms/Button";
import { Input } from "./atoms/Input";
import { Select } from "./atoms/Select";
import { HourItems, MinuteItems, TimezoneItems } from "~/utils/date-items";
import { getPageTitle } from "~/utils/notion-utils";
import { MultiSelect } from "./atoms/MultiSelect";

interface FormValues {
  name: string;
  collectionIds: string[];
  hour: number;
  minute: number;
  timezone: string;
}

export function CreateConnectorForm({
  collections,
  notionPages,
  notionToken,
}: {
  collections: Collection[];
  notionPages: (DatabaseObjectResponse | PageObjectResponse)[];
  notionToken: NotionToken;
}) {
  const router = useRouter();

  const form = useForm<FormValues>({
    defaultValues: {
      name: "",
      collectionIds: [],
      hour: 0,
      minute: 0,
      timezone: "UTC",
    },
  });

  const { mutate: createNotionConnector, isPending } =
    api.connectors.create.useMutation({
      onSuccess: () => {
        router.push("/connectors");
        router.refresh();
      },
    });

  const onSubmit = (data: FormValues) => {
    // Convert hour and minute to cron format
    const cronJob = `${data.minute} ${data.hour} * * *`;

    createNotionConnector({
      ...data,
      notionToken,
      cronJob,
      cronJobTimezone: data.timezone,
    });
  };

  const isFormValid =
    form.watch("name") &&
    form.watch("collectionIds").length > 0 &&
    form.watch("hour") !== undefined &&
    form.watch("minute") !== undefined &&
    form.watch("timezone") !== undefined;

  const previewData: NotionPreviewData[] = notionPages.map((r) => ({
    id: r.id,
    object: r.object,
    title: getPageTitle(r),
    url: r.url ?? "",
  }));

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex max-w-2xl flex-col gap-6"
    >
      <NotionConnectorPreview pages={previewData} />

      <div className="flex flex-col">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Name
        </label>
        <p className="text-gray-600">
          Enter a display name for this connector.
        </p>
        <Controller
          name="name"
          control={form.control}
          rules={{ required: true }}
          render={({ field }) => (
            <Input {...field} type="text" placeholder="Connector name" />
          )}
        />
      </div>

      <div className="flex flex-col">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Collections
        </label>
        <p className="text-gray-600">
          Select the collections you want to sync data to.
        </p>
        <Controller
          name="collectionIds"
          control={form.control}
          rules={{ required: true }}
          render={({ field }) => (
            <MultiSelect
              items={collections.map((collection) => ({
                key: collection.id,
                value: collection.id,
                label: collection.name,
              }))}
              onChange={field.onChange}
              placeholder="Select collections"
            />
          )}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Schedule
        </label>
        <p className="text-sm text-zinc-500">
          We will run your connector every day, please pick a time and time
          zone.
        </p>
        <div className="flex items-center gap-2">
          <Controller
            name="hour"
            control={form.control}
            rules={{ required: true }}
            render={({ field }) => (
              <Select
                items={HourItems}
                onChange={field.onChange}
                placeholder="Hour"
                className="w-[120px]"
              />
            )}
          />
          <span className="text-xl">:</span>
          <Controller
            name="minute"
            control={form.control}
            rules={{ required: true }}
            render={({ field }) => (
              <Select
                items={MinuteItems}
                onChange={field.onChange}
                placeholder="Minute"
                className="w-[120px]"
              />
            )}
          />
          <span className="mx-2">in</span>
          <Controller
            name="timezone"
            control={form.control}
            rules={{ required: true }}
            render={({ field }) => (
              <Select
                items={TimezoneItems}
                onChange={field.onChange}
                placeholder="Select timezone"
                className="w-[240px]"
              />
            )}
          />
        </div>
      </div>

      <Button
        isLoading={isPending}
        disabled={!isFormValid}
        className="ml-auto mt-2 rounded bg-orange-600 px-3 py-1 text-sm font-semibold hover:bg-orange-500"
        type="submit"
      >
        Create Connector
      </Button>
    </form>
  );
}
