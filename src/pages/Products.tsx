import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Upload, Image as ImageIcon, X, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { productStorage } from "@/lib/storage-simple";
import { Product } from "@/types";
import { CategoryManagementModal } from "@/components/CategoryManagementModal";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryHierarchy, setCategoryHierarchy] = useState<Record<string, string[]>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [componentError, setComponentError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    taxRate: 8.1,
    imageUrl: "",
    category: "",
    isActive: true
  });
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Error boundary for component
  if (componentError) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Fehler beim Laden der Produkte</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Ein Fehler ist aufgetreten: {componentError}</p>
            <Button onClick={() => {
              setComponentError(null);
              window.location.reload();
            }}>
              Seite neu laden
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default categories as per project specification
  const defaultCategories = [
    'Produkte', 'Dienstleistungen', 'Beratung', 'Software', 
    'Hardware', 'Wartung', 'Schulung', 'Material', 'Lizenz', 'Sonstiges'
  ];

  // Load categories from localStorage with hierarchy support
  const loadCategories = useCallback(() => {
    try {
      const savedCategories = localStorage.getItem('productCategories');
      const savedHierarchy = localStorage.getItem('categoryHierarchy');
      
      if (savedCategories) {
        const parsed = JSON.parse(savedCategories);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCategories(parsed);
        }
      }
      
      if (savedHierarchy) {
        const parsedHierarchy = JSON.parse(savedHierarchy);
        if (typeof parsedHierarchy === 'object') {
          setCategoryHierarchy(parsedHierarchy);
        }
      }
      
      // If no saved data, use defaults
      if (!savedCategories || !savedHierarchy) {
        setCategories(defaultCategories);
        setCategoryHierarchy({});
        localStorage.setItem('productCategories', JSON.stringify(defaultCategories));
        localStorage.setItem('categoryHierarchy', JSON.stringify({}));
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories(defaultCategories);
      setCategoryHierarchy({});
    }
  }, []);

  // Load products with error handling
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const allProducts = await productStorage.getAll();
      setProducts(allProducts);
      if (selectedCategory) {
        const filtered = allProducts.filter(product => product.category === selectedCategory);
        setFilteredProducts(filtered);
      } else {
        setFilteredProducts(allProducts);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: "Fehler",
        description: "Produkte konnten nicht geladen werden.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, toast]);

  // Filter products by category
  const filterProducts = useCallback((productList: Product[], categoryFilter: string) => {
    if (!categoryFilter || categoryFilter === "") {
      setFilteredProducts(productList);
    } else {
      const filtered = productList.filter(product => product.category === categoryFilter);
      setFilteredProducts(filtered);
    }
  }, []);

  // Handle category filter change
  const handleCategoryFilter = useCallback((category: string) => {
    setSelectedCategory(category);
    filterProducts(products, category);
  }, [products, filterProducts]);

  // Handle category updates from modal
  const handleCategoriesUpdate = useCallback((updatedCategories: string[], updatedHierarchy: Record<string, string[]>) => {
    setCategories(updatedCategories);
    setCategoryHierarchy(updatedHierarchy);
  }, []);

  // Get all categories including subcategories for display
  const getAllDisplayCategories = useCallback(() => {
    const allCategories = [...categories];
    Object.values(categoryHierarchy).forEach(subCats => {
      allCategories.push(...subCats);
    });
    return [...new Set(allCategories)]; // Remove duplicates
  }, [categories, categoryHierarchy]);

  // Get category display name with parent info
  const getCategoryDisplayName = useCallback((category: string) => {
    const parentCategory = Object.keys(categoryHierarchy).find(parent => 
      categoryHierarchy[parent].includes(category)
    );
    return parentCategory ? `${parentCategory} > ${category}` : category;
  }, [categoryHierarchy]);

  // Check if category is a subcategory
  const isSubCategory = useCallback((category: string) => {
    return Object.values(categoryHierarchy).some(subCats => subCats.includes(category));
  }, [categoryHierarchy]);

  // Get category count for display
  const getCategoryCount = useCallback((category: string) => {
    if (category === "") {
      return products.length;
    }
    return products.filter(p => p.category === category).length;
  }, [products]);

  // Image upload handler with validation
  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      // File size validation (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Fehler",
          description: "Bild ist zu groß. Maximale Größe: 5MB",
          variant: "destructive"
        });
        return;
      }

      // File type validation
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Fehler",
          description: "Bitte wählen Sie eine gültige Bilddatei aus.",
          variant: "destructive"
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const base64 = e.target?.result as string;
          if (base64) {
            setFormData(prev => ({ ...prev, imageUrl: base64 }));
          }
        } catch (error) {
          console.error('Error processing image:', error);
          toast({
            title: "Fehler",
            description: "Fehler beim Verarbeiten des Bildes.",
            variant: "destructive"
          });
        }
      };
      reader.onerror = () => {
        toast({
          title: "Fehler",
          description: "Fehler beim Lesen der Datei.",
          variant: "destructive"
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error handling image upload:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Hochladen des Bildes.",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Delete category (handle subcategories)
  const deleteCategory = useCallback((categoryToDelete: string) => {
    try {
      console.log('Attempting to delete category:', categoryToDelete);
      
      const allCategories = getAllDisplayCategories();
      const categoryInUse = products.some(product => product.category === categoryToDelete);
      
      if (categoryInUse) {
        toast({
          title: "Fehler",
          description: `Kategorie "${categoryToDelete}" kann nicht gelöscht werden, da sie von Produkten verwendet wird.`,
          variant: "destructive"
        });
        return;
      }
      
      // Check if it's a subcategory
      const parentCategory = Object.keys(categoryHierarchy).find(parent => 
        categoryHierarchy[parent].includes(categoryToDelete)
      );
      
      if (parentCategory) {
        // Delete subcategory
        const updatedHierarchy = {
          ...categoryHierarchy,
          [parentCategory]: categoryHierarchy[parentCategory].filter(sub => sub !== categoryToDelete)
        };
        
        // Remove parent if no subcategories left
        if (updatedHierarchy[parentCategory].length === 0) {
          delete updatedHierarchy[parentCategory];
        }
        
        setCategoryHierarchy(updatedHierarchy);
        localStorage.setItem('categoryHierarchy', JSON.stringify(updatedHierarchy));
      } else {
        // Delete main category and all its subcategories
        const updatedCategories = categories.filter(cat => cat !== categoryToDelete);
        const updatedHierarchy = { ...categoryHierarchy };
        delete updatedHierarchy[categoryToDelete];
        
        setCategories(updatedCategories);
        setCategoryHierarchy(updatedHierarchy);
        localStorage.setItem('productCategories', JSON.stringify(updatedCategories));
        localStorage.setItem('categoryHierarchy', JSON.stringify(updatedHierarchy));
      }
      
      // Reset selected category if deleted
      if (selectedCategory === categoryToDelete) {
        setSelectedCategory("");
        setFilteredProducts(products);
      }
      
      toast({
        title: "Kategorie gelöscht",
        description: `"${categoryToDelete}" wurde erfolgreich gelöscht.`
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Löschen der Kategorie.",
        variant: "destructive"
      });
    }
  }, [categories, categoryHierarchy, products, selectedCategory, toast, getAllDisplayCategories]);

  // Form handlers
  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      description: "",
      price: 0,
      taxRate: 8.1,
      imageUrl: "",
      category: "",
      isActive: true
    });
    setEditingProduct(null);
  }, []);

  const handleOpenDialog = useCallback((product?: Product) => {
    try {
      console.log('Opening dialog for product:', product);
      if (product) {
        setEditingProduct(product);
        setFormData({
          name: product.name || "",
          description: product.description || "",
          price: product.price || 0,
          taxRate: product.taxRate || 8.1,
          imageUrl: product.imageUrl || "",
          category: product.category || "",
          isActive: product.isActive !== false
        });
      } else {
        resetForm();
      }
      setIsDialogOpen(true);
      console.log('Dialog should be open now');
    } catch (error) {
      console.error('Error opening dialog:', error);
      setComponentError('Error opening product dialog');
    }
  }, [resetForm]);

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    resetForm();
  }, [resetForm]);

  // Form submission with comprehensive validation
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    if (!formData.name.trim()) {
      toast({
        title: "Fehler",
        description: "Produktname ist erforderlich.",
        variant: "destructive"
      });
      return;
    }

    if (formData.price < 0) {
      toast({
        title: "Fehler",
        description: "Preis muss größer oder gleich 0 sein.",
        variant: "destructive"
      });
      return;
    }

    if (formData.taxRate < 0 || formData.taxRate > 100) {
      toast({
        title: "Fehler",
        description: "MwSt.-Satz muss zwischen 0 und 100 sein.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      if (editingProduct) {
        await productStorage.update(editingProduct.id, formData);
        toast({
          title: "Erfolgreich",
          description: "Produkt wurde aktualisiert."
        });
      } else {
        await productStorage.add(formData);
        toast({
          title: "Erfolgreich",
          description: "Produkt wurde hinzugefügt."
        });
      }
      
      await loadProducts();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Speichern des Produkts.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [formData, editingProduct, toast, loadProducts, handleCloseDialog]);

  // Delete product
  const handleDelete = useCallback(async (productId: string) => {
    try {
      setLoading(true);
      await productStorage.delete(productId);
      await loadProducts();
      toast({
        title: "Erfolgreich",
        description: "Produkt wurde gelöscht."
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Löschen des Produkts.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [loadProducts, toast]);

  // Duplicate product
  const handleDuplicateProduct = useCallback(async (product: Product) => {
    try {
      toast({
        title: "Dupliziert...",
        description: "Produkt wird dupliziert..."
      });
      
      // Generate unique ID with fallback for older browsers
      const generateId = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          return crypto.randomUUID();
        } else {
          // Fallback: Generate UUID v4 format for older browsers
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        }
      };
      
      // Create duplicate product with new ID and modified name
      const today = new Date();
      const duplicatedProduct: Product = {
        ...product,
        id: generateId(),
        name: `${product.name} (Kopie)`,
        description: `Dupliziert von "${product.name}" am ${today.toLocaleDateString('de-DE')}${product.description ? '\n\n' + product.description : ''}`,
        createdAt: today.toISOString(),
        updatedAt: today.toISOString()
      };
      
      console.log('Duplicating product:', {
        original: product.name,
        new: duplicatedProduct.name
      });
      
      // Add the duplicated product
      await productStorage.add(duplicatedProduct);
      await loadProducts(); // Reload to get updated data
      
      toast({
        title: "Erfolgreich",
        description: `Produkt "${product.name}" wurde als "${duplicatedProduct.name}" dupliziert.`
      });
    } catch (error) {
      console.error('Error duplicating product:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      toast({
        title: "Fehler",
        description: `Fehler beim Duplizieren des Produkts: ${errorMessage}`,
        variant: "destructive"
      });
    }
  }, [loadProducts, toast]);

  // Remove duplicate status from product
  const handleRemoveDuplicateStatus = useCallback(async (product: Product) => {
    try {
      // Remove duplicate information from description
      const cleanDescription = product.description
        ?.replace(/Dupliziert von ".*?" am \d{1,2}\.\d{1,2}\.\d{4}\n\n/, '')
        ?.replace(/Dupliziert von ".*?" am \d{1,2}\.\d{1,2}\.\d{4}/, '')
        ?.trim() || '';
      
      const updatedProduct = {
        ...product,
        description: cleanDescription,
        updatedAt: new Date().toISOString()
      };
      
      await productStorage.update(product.id, updatedProduct);
      await loadProducts(); // Reload to get updated data
      
      toast({
        title: "Erfolgreich",
        description: "Duplikat-Status wurde entfernt."
      });
    } catch (error) {
      console.error('Error removing duplicate status:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Entfernen des Duplikat-Status.",
        variant: "destructive"
      });
    }
  }, [loadProducts, toast]);

  // Initialize data on component mount
  useEffect(() => {
    loadCategories();
  }, []);
  
  useEffect(() => {
    loadProducts();
  }, [selectedCategory]);

  try {
    return (
      <div className="container mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Produkte</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Verwalten Sie Ihre Produkte und Dienstleistungen
          </p>
        </div>
        
        <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Neues Produkt
        </Button>
        
        {/* Simple Modal instead of Dialog */}
        {isDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">
                  {editingProduct ? "Produkt bearbeiten" : "Neues Produkt"}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseDialog}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Product Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Produktname *</Label>
                  <Input
                    id="name"
                    placeholder="z.B. Premium Beratung"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                
                {/* Category with Add Option */}
                <div className="space-y-2">
                  <Label htmlFor="category">Kategorie</Label>
                  <div className="flex gap-2">
                    <select
                      id="category"
                      className="flex-1 p-2 border rounded"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    >
                      <option value="">Keine Kategorie</option>
                      {getAllDisplayCategories().map((category) => (
                        <option key={category} value={category}>
                          {getCategoryDisplayName(category)}
                        </option>
                      ))}
                    </select>
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsCategoryModalOpen(true)}
                      className="border-dashed border-2 text-muted-foreground hover:text-foreground"
                    >
                      + Kategorie
                    </Button>
                  </div>
                </div>
                
                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Beschreibung (optional)</Label>
                  <textarea
                    id="description"
                    className="w-full p-2 border rounded"
                    placeholder="Beschreibung des Produkts..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
                
                {/* Price */}
                <div className="space-y-2">
                  <Label htmlFor="price">Preis (CHF)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>
                
                {/* Tax Rate */}
                <div className="space-y-2">
                  <Label htmlFor="taxRate">MwSt.-Satz (%)</Label>
                  <select
                    id="taxRate"
                    className="w-full p-2 border rounded"
                    value={formData.taxRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, taxRate: parseFloat(e.target.value) }))}
                  >
                    <option value="0">0%</option>
                    <option value="2.5">2.5%</option>
                    <option value="3.7">3.7%</option>
                    <option value="7.7">7.7%</option>
                    <option value="8.1">8.1%</option>
                  </select>
                </div>
                
                {/* Image Upload */}
                <div className="space-y-2">
                  <Label>Produktbild (optional)</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    {formData.imageUrl ? (
                      <div className="space-y-2">
                        <div className="relative w-32 h-32 mx-auto">
                          <img 
                            src={formData.imageUrl} 
                            alt="Product preview" 
                            className="w-full h-full object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full text-xs hover:bg-red-700"
                            onClick={() => setFormData(prev => ({ ...prev, imageUrl: "" }))}
                          >
                            ✕
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 text-center">Bild hochgeladen</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">Bild hochladen (max. 5MB)</p>
                          <div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                              id="imageUpload"
                            />
                            <button
                              type="button"
                              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50"
                              onClick={() => document.getElementById('imageUpload')?.click()}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Datei auswählen
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Active Status */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  />
                  <Label htmlFor="isActive">Produkt ist aktiv</Label>
                </div>
                
                {/* Form Actions */}
                <div className="flex flex-col sm:flex-row justify-end gap-2">
                  <Button type="button" variant="outline" onClick={handleCloseDialog} className="w-full sm:w-auto">
                    Abbrechen
                  </Button>
                  <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                    {loading ? "Speichert..." : (editingProduct ? "Aktualisieren" : "Hinzufügen")}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      
      {/* Category Filter Buttons */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === "" ? "default" : "outline"}
            size={isMobile ? "sm" : "sm"}
            onClick={() => handleCategoryFilter("")}
            className={isMobile ? "text-xs px-2 py-1" : ""}
          >
            Alle Kategorien ({getCategoryCount("")})
          </Button>
          {getAllDisplayCategories().map((category) => {
            const categoryInUse = products.some(product => product.category === category);
            const canDelete = !categoryInUse;
            const displayName = getCategoryDisplayName(category);
            const isSubCat = isSubCategory(category);
            
            return (
            <div key={category} className="relative group">
              <Button
                variant={selectedCategory === category ? "default" : "outline"}
                size={isMobile ? "sm" : "sm"}
                onClick={() => handleCategoryFilter(category)}
                className={`${canDelete ? "pr-8" : ""} ${isSubCat ? "ml-4 text-sm" : ""} ${isMobile ? "text-xs px-2 py-1" : ""}`}
              >
                {displayName} ({getCategoryCount(category)})
              </Button>
              {canDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteCategory(category);
                  }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center hover:bg-red-600"
                  title="Kategorie löschen"
                >
                  ×
                </button>
              )}
            </div>
            );
          })}
          
          {/* Add Category Button */}
          <Button
            variant="outline"
            size={isMobile ? "sm" : "sm"}
            onClick={() => setIsCategoryModalOpen(true)}
            className={`border-dashed border-2 text-muted-foreground hover:text-foreground ${isMobile ? "text-xs px-2 py-1" : ""}`}
          >
            + Add Kategorie
          </Button>
        </div>
      </div>
      
      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              {selectedCategory 
                ? `${selectedCategory} (${filteredProducts.length})` 
                : `Alle Produkte (${products.length})`
              }
            </span>
            {loading && <span className="text-sm text-muted-foreground">Lädt...</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isMobile ? (
            // Mobile Card Layout
            <div className="space-y-4">
              {filteredProducts.length === 0 ? (
                <div className="h-24 flex items-center justify-center text-center text-muted-foreground">
                  {loading 
                    ? "Lädt Produkte..." 
                    : selectedCategory 
                      ? `Keine Produkte in der Kategorie "${selectedCategory}" gefunden.`
                      : "Noch keine Produkte vorhanden. Fügen Sie Ihr erstes Produkt hinzu."
                  }
                </div>
              ) : (
                filteredProducts.map((product) => {
                  const isDuplicate = product.description?.includes('Dupliziert von') || false;
                  return (
                    <Card key={product.id} className="p-4">
                      <div className="space-y-3">
                        {/* Product Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3 flex-1">
                            {product.imageUrl && (
                              <img 
                                src={product.imageUrl} 
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded border flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-medium text-sm truncate" title={product.name}>
                                  {product.name}
                                </h3>
                                {isDuplicate && (
                                  <div className="relative group">
                                    <Badge variant="outline" className="flex-shrink-0 text-blue-600 border-blue-300 bg-blue-50 text-xs pr-6">
                                      <Copy className="w-3 h-3 mr-1" />
                                      Duplikat
                                    </Badge>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveDuplicateStatus(product);
                                      }}
                                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center hover:bg-red-600"
                                      title="Duplikat-Status entfernen"
                                    >
                                      ×
                                    </button>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                {product.category ? (
                                  <Badge variant="outline" className="text-xs">{product.category}</Badge>
                                ) : null}
                                <Badge 
                                  variant={product.isActive !== false ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {product.isActive !== false ? "Aktiv" : "Inaktiv"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Product Details */}
                        <div className="space-y-2">
                          {product.description && (
                            <p className="text-sm text-muted-foreground overflow-hidden" style={{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'}}>
                              {product.description}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="text-lg font-semibold text-blue-600">
                                CHF {product.price.toFixed(2)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                MwSt. {product.taxRate}%
                              </div>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDialog(product)}
                                title="Bearbeiten"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => handleDuplicateProduct(product)}
                                title="Produkt duplizieren"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700"
                                    title="Löschen"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Produkt löschen</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Sind Sie sicher, dass Sie "{product.name}" löschen möchten? 
                                      Diese Aktion kann nicht rückgängig gemacht werden.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDelete(product.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Löschen
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          ) : (
            // Desktop Table Layout
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Produkt</TableHead>
                    <TableHead className="w-[120px]">Kategorie</TableHead>
                    <TableHead>Beschreibung</TableHead>
                    <TableHead className="text-right w-[100px]">Preis</TableHead>
                    <TableHead className="text-right w-[80px]">MwSt.</TableHead>
                    <TableHead className="w-[80px]">Status</TableHead>
                    <TableHead className="w-[120px]">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        {loading 
                          ? "Lädt Produkte..." 
                          : selectedCategory 
                            ? `Keine Produkte in der Kategorie "${selectedCategory}" gefunden.`
                            : "Noch keine Produkte vorhanden. Fügen Sie Ihr erstes Produkt hinzu."
                        }
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => {
                      const isDuplicate = product.description?.includes('Dupliziert von') || false;
                      return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            {product.imageUrl && (
                              <img 
                                src={product.imageUrl} 
                                alt={product.name}
                                className="w-10 h-10 object-cover rounded border"
                              />
                            )}
                            <div className="flex items-center gap-4">
                              <span className="font-medium truncate" title={product.name}>
                                {product.name}
                              </span>
                              {isDuplicate && (
                                <div className="relative group ml-2">
                                  <Badge variant="outline" className="flex-shrink-0 text-blue-600 border-blue-300 bg-blue-50 pr-6">
                                    <Copy className="w-3 h-3 mr-1" />
                                    Duplikat
                                  </Badge>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveDuplicateStatus(product);
                                    }}
                                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center hover:bg-red-600"
                                    title="Duplikat-Status entfernen"
                                  >
                                    ×
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {product.category ? (
                            <Badge variant="outline">{product.category}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate" title={product.description}>
                            {product.description || "-"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          CHF {product.price.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          {product.taxRate}%
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={product.isActive !== false ? "default" : "secondary"}
                          >
                            {product.isActive !== false ? "Aktiv" : "Inaktiv"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(product)}
                              title="Bearbeiten"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => handleDuplicateProduct(product)}
                              title="Produkt duplizieren"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  title="Löschen"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Produkt löschen</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Sind Sie sicher, dass Sie "{product.name}" löschen möchten? 
                                    Diese Aktion kann nicht rückgängig gemacht werden.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDelete(product.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Löschen
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        </Card>
        
        {/* Category Management Modal */}
        <CategoryManagementModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          categories={categories}
          categoryHierarchy={categoryHierarchy}
          onCategoriesUpdate={handleCategoriesUpdate}
          getAllDisplayCategories={getAllDisplayCategories}
        />
      </div>
    );
  } catch (error) {
    console.error('Products component render error:', error);
    setComponentError(error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}