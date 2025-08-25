import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  categoryHierarchy: Record<string, string[]>;
  onCategoriesUpdate: (categories: string[], hierarchy: Record<string, string[]>) => void;
  getAllDisplayCategories: () => string[];
}

export function CategoryManagementModal({
  isOpen,
  onClose,
  categories,
  categoryHierarchy,
  onCategoriesUpdate,
  getAllDisplayCategories
}: CategoryManagementModalProps) {
  const [newCategory, setNewCategory] = useState("");
  const [newSubCategory, setNewSubCategory] = useState("");
  const [selectedParentCategory, setSelectedParentCategory] = useState<string>("");
  const [isAddingSubCategory, setIsAddingSubCategory] = useState(false);
  const { toast } = useToast();

  // Add new category
  const addCategory = useCallback(() => {
    if (!newCategory.trim()) {
      toast({
        title: "Fehler",
        description: "Kategoriename darf nicht leer sein.",
        variant: "destructive"
      });
      return;
    }

    const allCategories = getAllDisplayCategories();
    if (allCategories.includes(newCategory.trim())) {
      toast({
        title: "Fehler",
        description: "Diese Kategorie existiert bereits.",
        variant: "destructive"
      });
      return;
    }

    const updatedCategories = [...categories, newCategory.trim()];
    
    try {
      localStorage.setItem('productCategories', JSON.stringify(updatedCategories));
      onCategoriesUpdate(updatedCategories, categoryHierarchy);
    } catch (error) {
      console.error('Error saving categories:', error);
    }
    
    setNewCategory("");
    
    toast({
      title: "Kategorie hinzugefügt",
      description: `"${newCategory.trim()}" wurde erfolgreich hinzugefügt.`
    });
  }, [categories, categoryHierarchy, newCategory, toast, getAllDisplayCategories, onCategoriesUpdate]);

  // Add subcategory
  const addSubCategory = useCallback(() => {
    if (!newSubCategory.trim() || !selectedParentCategory) {
      toast({
        title: "Fehler",
        description: "Unterkategoriename und übergeordnete Kategorie sind erforderlich.",
        variant: "destructive"
      });
      return;
    }

    const allCategories = getAllDisplayCategories();
    if (allCategories.includes(newSubCategory.trim())) {
      toast({
        title: "Fehler",
        description: "Diese Unterkategorie existiert bereits.",
        variant: "destructive"
      });
      return;
    }

    const updatedHierarchy = {
      ...categoryHierarchy,
      [selectedParentCategory]: [
        ...(categoryHierarchy[selectedParentCategory] || []),
        newSubCategory.trim()
      ]
    };
    
    try {
      localStorage.setItem('categoryHierarchy', JSON.stringify(updatedHierarchy));
      onCategoriesUpdate(categories, updatedHierarchy);
    } catch (error) {
      console.error('Error saving category hierarchy:', error);
    }
    
    setNewSubCategory("");
    setSelectedParentCategory("");
    setIsAddingSubCategory(false);
    
    toast({
      title: "Unterkategorie hinzugefügt",
      description: `"${newSubCategory.trim()}" wurde unter "${selectedParentCategory}" hinzugefügt.`
    });
  }, [categoryHierarchy, newSubCategory, selectedParentCategory, toast, getAllDisplayCategories, categories, onCategoriesUpdate]);

  // Reset form when closing
  const handleClose = () => {
    setNewCategory("");
    setNewSubCategory("");
    setSelectedParentCategory("");
    setIsAddingSubCategory(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[80vh] overflow-y-auto p-6 m-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Kategorien verwalten</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-6">
          {/* Add Main Category Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Neue Hauptkategorie</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Kategoriename"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && addCategory()}
              />
              <Button
                onClick={addCategory}
                disabled={!newCategory.trim()}
              >
                Hinzufügen
              </Button>
            </div>
          </div>

          {/* Add Subcategory Section */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Unterkategorie hinzufügen</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddingSubCategory(!isAddingSubCategory)}
              >
                {isAddingSubCategory ? "Abbrechen" : "+ Unterkategorie"}
              </Button>
            </div>

            {isAddingSubCategory && (
              <div className="space-y-3 p-3 bg-blue-50 rounded">
                <div>
                  <Label className="text-xs text-muted-foreground">Übergeordnete Kategorie</Label>
                  <select
                    value={selectedParentCategory}
                    onChange={(e) => setSelectedParentCategory(e.target.value)}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Wählen Sie eine Kategorie</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Label className="text-xs text-muted-foreground">Unterkategoriename</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Unterkategoriename"
                      value={newSubCategory}
                      onChange={(e) => setNewSubCategory(e.target.value)}
                      className="flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && addSubCategory()}
                    />
                    <Button
                      onClick={addSubCategory}
                      disabled={!newSubCategory.trim() || !selectedParentCategory}
                      size="sm"
                    >
                      ✓
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Current Categories Display */}
          <div className="space-y-3 border-t pt-4">
            <Label className="text-sm font-medium">Aktuelle Kategorien</Label>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {categories.map((category) => (
                <div key={category} className="p-2 bg-gray-50 rounded text-sm">
                  <div className="font-medium">{category}</div>
                  {categoryHierarchy[category] && categoryHierarchy[category].length > 0 && (
                    <div className="ml-4 mt-1 space-y-1">
                      {categoryHierarchy[category].map((subCat) => (
                        <div key={subCat} className="text-muted-foreground text-xs">
                          → {subCat}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Schließen
          </Button>
        </div>
      </div>
    </div>
  );
}