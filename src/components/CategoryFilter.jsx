import { categories } from "@/data/places";
import { Button } from "@/components/ui/button";

const categoryColors = {
  places: "bg-category-places text-white",
  food: "bg-category-food text-white",
  markets: "bg-category-markets text-white",
  handicrafts: "bg-category-handicrafts text-white",
};

export const CategoryFilter = ({ selectedCategory, onCategoryChange }) => (
  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
    <Button variant={selectedCategory === "all" ? "default" : "outline"} size="sm" onClick={() => onCategoryChange("all")} className="shrink-0">
      All
    </Button>
    {categories.map((category) => (
      <Button
        key={category.id}
        variant="outline"
        size="sm"
        onClick={() => onCategoryChange(category.id)}
        className={`shrink-0 transition-all ${
          selectedCategory === category.id ? categoryColors[category.id] : "hover:scale-105"
        }`}
      >
        {category.label}
      </Button>
    ))}
  </div>
);
