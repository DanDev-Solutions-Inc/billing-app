import "server-only";
import { SupabaseClient } from "@typings/SupabaseClient";
import { LineItem } from "@typings/line-item/LineItem";
import { LineItemFormValues } from "@interfaces/forms/LineItemFormValues";

type ParentType = LineItem["parent_type"];

export const listLineItems = async (
  sb: SupabaseClient,
  parentType: ParentType,
  parentId: string,
): Promise<LineItem[]> => {
  const { data } = await sb
    .from("line_items")
    .select("*")
    .eq("parent_type", parentType)
    .eq("parent_id", parentId)
    .order("position");
  return data ?? [];
};

export const createLineItems = async (
  sb: SupabaseClient,
  args: {
    userId: string;
    parentType: ParentType;
    parentId: string;
    items: LineItemFormValues[];
  },
): Promise<{ error?: string }> => {
  const { error } = await sb.from("line_items").insert(
    args.items.map((it, i) => ({
      user_id: args.userId,
      parent_type: args.parentType,
      parent_id: args.parentId,
      description: it.description,
      quantity: it.quantity,
      unit_price: it.unit_price,
      position: i,
    })),
  );
  return { error: error?.message };
};

export const deleteLineItems = async (
  sb: SupabaseClient,
  parentType: ParentType,
  parentId: string,
): Promise<void> => {
  await sb
    .from("line_items")
    .delete()
    .eq("parent_type", parentType)
    .eq("parent_id", parentId);
};
