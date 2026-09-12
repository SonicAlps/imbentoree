import { supabase } from "@/src/lib/supabase";

export async function calculateBagCost(bagTypeName: string) {
  try {
    // 1. Get bag_type_id
    const { data: bagType, error: bagTypeError } = await supabase
      .from("bag_types")
      .select("id")
      .eq("name", bagTypeName)
      .single();

    if (bagTypeError || !bagType) {
      console.error("Bag type not found:", bagTypeName);
      return null;
    }

    // 2. Get all materials for this bag type
    const { data: bagMaterials, error: materialsError } = await supabase
      .from("bag_type_materials")
      .select(
        `
        quantity_needed,
        materials (
          id,
          cost_per_unit
        )
      `
      )
      .eq("bag_type_id", bagType.id);

    if (materialsError || !bagMaterials) {
      console.error("Failed to fetch materials:", materialsError);
      return null;
    }

    // 3. Calculate total material cost
    let materialCost = 0;
    bagMaterials.forEach((item: any) => {
      materialCost += item.quantity_needed * item.materials.cost_per_unit;
    });

    // 4. Get labor cost (for now, hardcoded — you can move to DB later)
    const laborCosts: { [key: string]: number } = {
      "Pouch": 200,
      "Small Sling": 250,
      "Big Sling": 300,
    };

    const laborCost = laborCosts[bagTypeName] || 0;
    const totalProductionCost = materialCost + laborCost;

    return {
      materialCost: Math.round(materialCost * 100) / 100,
      laborCost,
      totalProductionCost: Math.round(totalProductionCost * 100) / 100,
    };
  } catch (error) {
    console.error("Error calculating bag cost:", error);
    return null;
  }
}

export async function calculateProfit(
  sellingPrice: number,
  bagTypeName: string
) {
  const costs = await calculateBagCost(bagTypeName);
  if (!costs) return null;

  const profit = sellingPrice - costs.totalProductionCost;
  const profitMargin = (profit / sellingPrice) * 100;

  return {
    ...costs,
    profit: Math.round(profit * 100) / 100,
    profitMargin: Math.round(profitMargin * 100) / 100,
  };
}