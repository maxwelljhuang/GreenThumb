'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SearchFilters as SearchFiltersType } from '@/types'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'

interface SearchFiltersProps {
  filters: SearchFiltersType
  onFiltersChange: (filters: SearchFiltersType) => void
}

export function SearchFilters({ filters, onFiltersChange }: SearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handlePriceChange = (field: 'minPrice' | 'maxPrice', value: number | undefined) => {
    onFiltersChange({
      ...filters,
      [field]: value,
    })
  }

  const handleStockChange = (checked: boolean) => {
    onFiltersChange({
      ...filters,
      inStock: checked,
    })
  }

  const handleCategoryToggle = (category: string) => {
    const newCategories = filters.categories?.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...(filters.categories || []), category]
    
    onFiltersChange({
      ...filters,
      categories: newCategories,
    })
  }

  const handleBrandToggle = (brand: string) => {
    const newBrands = filters.brands?.includes(brand)
      ? filters.brands.filter(b => b !== brand)
      : [...(filters.brands || []), brand]
    
    onFiltersChange({
      ...filters,
      brands: newBrands,
    })
  }

  const clearFilters = () => {
    onFiltersChange({
      minPrice: undefined,
      maxPrice: undefined,
      inStock: true,
      categories: [],
      brands: [],
    })
  }

  const categories = ['Fashion', 'Home', 'Tech', 'Beauty', 'Sports', 'Books']
  const brands = ['Nike', 'Apple', 'Samsung', 'Adidas', 'Zara', 'H&M']

  return (
    <div className="bg-white rounded-lg shadow-sm border border-dune/20 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-forest">Filters</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-dune hover:text-forest"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </Button>
      </div>

      <div className={`space-y-4 ${isExpanded ? 'block' : 'hidden'}`}>
        {/* Price Range */}
        <div>
          <label className="text-sm font-medium text-forest mb-2 block">
            Price Range
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={filters.minPrice || ''}
              onChange={(e) => handlePriceChange('minPrice', e.target.value ? Number(e.target.value) : undefined)}
              className="text-sm"
            />
            <Input
              type="number"
              placeholder="Max"
              value={filters.maxPrice || ''}
              onChange={(e) => handlePriceChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
              className="text-sm"
            />
          </div>
        </div>

        {/* In Stock */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="inStock"
            checked={filters.inStock || false}
            onCheckedChange={handleStockChange}
          />
          <label htmlFor="inStock" className="text-sm text-forest">
            In Stock Only
          </label>
        </div>

        {/* Categories */}
        <div>
          <label className="text-sm font-medium text-forest mb-2 block">
            Categories
          </label>
          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category}`}
                  checked={filters.categories?.includes(category) || false}
                  onCheckedChange={() => handleCategoryToggle(category)}
                />
                <label htmlFor={`category-${category}`} className="text-sm text-forest">
                  {category}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Brands */}
        <div>
          <label className="text-sm font-medium text-forest mb-2 block">
            Brands
          </label>
          <div className="space-y-2">
            {brands.map((brand) => (
              <div key={brand} className="flex items-center space-x-2">
                <Checkbox
                  id={`brand-${brand}`}
                  checked={filters.brands?.includes(brand) || false}
                  onCheckedChange={() => handleBrandToggle(brand)}
                />
                <label htmlFor={`brand-${brand}`} className="text-sm text-forest">
                  {brand}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Clear Filters */}
        <Button
          variant="outline"
          size="sm"
          onClick={clearFilters}
          className="w-full"
        >
          Clear All Filters
        </Button>
      </div>
    </div>
  )
}
