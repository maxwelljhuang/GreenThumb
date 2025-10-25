'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { SearchFilters } from '@/types'

interface AdvancedFiltersProps {
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
  onClearFilters: () => void
  className?: string
}

interface FilterSection {
  id: string
  title: string
  isOpen: boolean
}

export function AdvancedFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  className,
}: AdvancedFiltersProps) {
  const [sections, setSections] = useState<FilterSection[]>([
    { id: 'price', title: 'Price Range', isOpen: true },
    { id: 'category', title: 'Category', isOpen: false },
    { id: 'brand', title: 'Brand', isOpen: false },
    { id: 'availability', title: 'Availability', isOpen: false },
  ])

  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.minPrice || 0,
    filters.maxPrice || 1000,
  ])

  // Mock data - in real app, this would come from API
  const categories = [
    { id: 'fashion', name: 'Fashion', count: 1234 },
    { id: 'home', name: 'Home & Garden', count: 856 },
    { id: 'beauty', name: 'Beauty & Health', count: 432 },
    { id: 'electronics', name: 'Electronics', count: 321 },
    { id: 'sports', name: 'Sports & Outdoors', count: 198 },
    { id: 'books', name: 'Books & Media', count: 156 },
  ]

  const brands = [
    { id: 'nike', name: 'Nike', count: 234 },
    { id: 'adidas', name: 'Adidas', count: 189 },
    { id: 'apple', name: 'Apple', count: 156 },
    { id: 'samsung', name: 'Samsung', count: 143 },
    { id: 'sony', name: 'Sony', count: 98 },
    { id: 'patagonia', name: 'Patagonia', count: 87 },
  ]

  const toggleSection = useCallback((sectionId: string) => {
    setSections(prev =>
      prev.map(section =>
        section.id === sectionId
          ? { ...section, isOpen: !section.isOpen }
          : section
      )
    )
  }, [])

  const handlePriceChange = useCallback((values: number[]) => {
    const [min, max] = values
    setPriceRange([min, max])
    onFiltersChange({
      ...filters,
      minPrice: min,
      maxPrice: max,
    })
  }, [filters, onFiltersChange])

  const handleCategoryToggle = useCallback((categoryId: string) => {
    const currentCategories = filters.categories || []
    const newCategories = currentCategories.includes(categoryId)
      ? currentCategories.filter(id => id !== categoryId)
      : [...currentCategories, categoryId]
    
    onFiltersChange({
      ...filters,
      categories: newCategories,
    })
  }, [filters, onFiltersChange])

  const handleBrandToggle = useCallback((brandId: string) => {
    const currentBrands = filters.brands || []
    const newBrands = currentBrands.includes(brandId)
      ? currentBrands.filter(id => id !== brandId)
      : [...currentBrands, brandId]
    
    onFiltersChange({
      ...filters,
      brands: newBrands,
    })
  }, [filters, onFiltersChange])

  const handleInStockToggle = useCallback((checked: boolean) => {
    onFiltersChange({
      ...filters,
      inStock: checked,
    })
  }, [filters, onFiltersChange])

  const hasActiveFilters = useCallback(() => {
    return (
      (filters.minPrice !== undefined && filters.minPrice > 0) ||
      (filters.maxPrice !== undefined && filters.maxPrice < 1000) ||
      (filters.categories && filters.categories.length > 0) ||
      (filters.brands && filters.brands.length > 0) ||
      filters.inStock === true
    )
  }, [filters])

  return (
    <div className={cn('bg-white rounded-lg border border-sage/20 p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-forest" />
          <h3 className="font-semibold text-forest">Filters</h3>
          {hasActiveFilters() && (
            <span className="bg-pine text-sand text-xs px-2 py-1 rounded-full">
              {[
                filters.minPrice !== undefined && filters.minPrice > 0,
                filters.maxPrice !== undefined && filters.maxPrice < 1000,
                filters.categories && filters.categories.length > 0,
                filters.brands && filters.brands.length > 0,
                filters.inStock === true,
              ].filter(Boolean).length}
            </span>
          )}
        </div>
        {hasActiveFilters() && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-dune hover:text-forest"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {/* Price Range */}
        <div>
          <button
            onClick={() => toggleSection('price')}
            className="flex items-center justify-between w-full text-left"
          >
            <span className="font-medium text-forest">Price Range</span>
            {sections.find(s => s.id === 'price')?.isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          <AnimatePresence>
            {sections.find(s => s.id === 'price')?.isOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-3"
              >
                <div className="px-2">
                  <Slider
                    value={priceRange}
                    onValueChange={handlePriceChange}
                    min={0}
                    max={1000}
                    step={10}
                    className="mb-4"
                  />
                  <div className="flex justify-between text-sm text-dune">
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1]}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Categories */}
        <div>
          <button
            onClick={() => toggleSection('category')}
            className="flex items-center justify-between w-full text-left"
          >
            <span className="font-medium text-forest">Category</span>
            {sections.find(s => s.id === 'category')?.isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          <AnimatePresence>
            {sections.find(s => s.id === 'category')?.isOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-3"
              >
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {categories.map(category => (
                    <label
                      key={category.id}
                      className="flex items-center gap-3 cursor-pointer hover:bg-sage/10 p-2 rounded"
                    >
                      <Checkbox
                        checked={filters.categories?.includes(category.id) || false}
                        onCheckedChange={() => handleCategoryToggle(category.id)}
                      />
                      <span className="flex-1 text-sm">{category.name}</span>
                      <span className="text-xs text-dune">{category.count}</span>
                    </label>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Brands */}
        <div>
          <button
            onClick={() => toggleSection('brand')}
            className="flex items-center justify-between w-full text-left"
          >
            <span className="font-medium text-forest">Brand</span>
            {sections.find(s => s.id === 'brand')?.isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          <AnimatePresence>
            {sections.find(s => s.id === 'brand')?.isOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-3"
              >
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {brands.map(brand => (
                    <label
                      key={brand.id}
                      className="flex items-center gap-3 cursor-pointer hover:bg-sage/10 p-2 rounded"
                    >
                      <Checkbox
                        checked={filters.brands?.includes(brand.id) || false}
                        onCheckedChange={() => handleBrandToggle(brand.id)}
                      />
                      <span className="flex-1 text-sm">{brand.name}</span>
                      <span className="text-xs text-dune">{brand.count}</span>
                    </label>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Availability */}
        <div>
          <button
            onClick={() => toggleSection('availability')}
            className="flex items-center justify-between w-full text-left"
          >
            <span className="font-medium text-forest">Availability</span>
            {sections.find(s => s.id === 'availability')?.isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          <AnimatePresence>
            {sections.find(s => s.id === 'availability')?.isOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-3"
              >
                <label className="flex items-center gap-3 cursor-pointer hover:bg-sage/10 p-2 rounded">
                  <Checkbox
                    checked={filters.inStock || false}
                    onCheckedChange={handleInStockToggle}
                  />
                  <span className="text-sm">In Stock Only</span>
                </label>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
