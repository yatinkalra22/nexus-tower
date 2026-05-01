"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createShipment } from "@/server/shipments";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const formSchema = z.object({
  id: z.string().min(1, "ID is required (e.g., SH-1001)"),
  name: z.string().min(1, "Name is required"),
  status: z.enum(["pending", "in_transit", "arrived", "delayed", "cancelled"]),
  originPortId: z.string().optional(),
  destinationPortId: z.string().optional(),
  carrierId: z.string().optional(),
  vesselMmsi: z.string().optional(),
});

export default function NewShipmentPage() {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: "pending",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await createShipment(values);
      toast.success("Shipment created successfully");
      router.push("/dashboard/shipments");
    } catch (error) {
      toast.error("Failed to create shipment");
    }
  }

  return (
    <div className="mx-auto max-w-2xl flex flex-col gap-6 w-full">
      <div>
        <h1 className="text-3xl font-bold">New Shipment</h1>
        <p className="text-muted-foreground text-sm">Create a new shipment manually.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 border p-6 rounded-lg bg-card">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shipment ID</FormLabel>
                  <FormControl>
                    <Input placeholder="SH-1234" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Electronics Batch A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="arrived">Arrived</SelectItem>
                    <SelectItem value="delayed">Delayed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="originPortId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Origin Port (UN/LOCODE)</FormLabel>
                  <FormControl>
                    <Input placeholder="SGSIN" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="destinationPortId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destination Port (UN/LOCODE)</FormLabel>
                  <FormControl>
                    <Input placeholder="NLRTM" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="carrierId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Carrier ID</FormLabel>
                  <FormControl>
                    <Input placeholder="MSK" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="vesselMmsi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vessel MMSI (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="211234567" {...field} />
                  </FormControl>
                  <FormDescription>For real-time AIS tracking.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit">Create Shipment</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
