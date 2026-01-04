#!/bin/bash

# Script de nettoyage des fichiers de backup après migration réussie
# Supprime les fichiers *_sql.php et *_api.php une fois la migration validée

echo "🧹 Nettoyage post-migration - Dashboard ForgeBlast"
echo "=================================================="
echo ""
echo "⚠️  ATTENTION : Ce script va supprimer les fichiers de sauvegarde"
echo "   Assurez-vous que la migration fonctionne correctement avant de continuer"
echo ""

# Compter les fichiers à supprimer
sql_files=$(find . -name "*_sql.php" 2>/dev/null | wc -l)
api_files=$(find . -name "*_api.php" 2>/dev/null | wc -l)
total=$((sql_files + api_files))

echo "📊 Fichiers trouvés :"
echo "   - Fichiers *_sql.php : $sql_files"
echo "   - Fichiers *_api.php : $api_files"
echo "   - Total : $total fichiers"
echo ""

if [ $total -eq 0 ]; then
    echo "✅ Aucun fichier de backup trouvé. Votre projet est déjà nettoyé !"
    exit 0
fi

echo "📁 Détail des fichiers à supprimer :"
echo ""
find . -name "*_sql.php" -o -name "*_api.php" 2>/dev/null | while read file; do
    echo "   🗑️  $file"
done
echo ""

read -p "Voulez-vous supprimer ces fichiers ? (oui/non) : " confirm

if [ "$confirm" != "oui" ]; then
    echo "❌ Nettoyage annulé"
    exit 0
fi

echo ""
echo "🗑️  Suppression en cours..."
echo ""

deleted=0

# Supprimer les fichiers *_sql.php
find . -name "*_sql.php" 2>/dev/null | while read file; do
    echo "   Suppression : $file"
    rm "$file"
    ((deleted++))
done

# Supprimer les fichiers *_api.php
find . -name "*_api.php" 2>/dev/null | while read file; do
    echo "   Suppression : $file"
    rm "$file"
    ((deleted++))
done

echo ""
echo "✅ Nettoyage terminé !"
echo "   $total fichiers supprimés"
echo ""
echo "📋 Prochaines étapes :"
echo "   1. Testez votre dashboard pour vérifier que tout fonctionne"
echo "   2. Si tout est OK, committez les changements"
echo "   3. Optionnel : Désactivez ou supprimez config/dbConnect.php"
echo ""
