#!/bin/bash

# Script de migration automatique - Dashboard ForgeBlast
# Bascule entre versions SQL et API des contrôleurs

CONTROLLER_DIR="./controller"
VIEW_DIR="./view"

echo "🚀 Migration Dashboard ForgeBlast vers API"
echo "=========================================="
echo ""

# Fonction pour afficher le menu
show_menu() {
    echo "Que voulez-vous faire ?"
    echo ""
    echo "1) ✅ Migrer TOUT vers l'API (Home + User + KPI + Overview)"
    echo "2) 🟡 Migrer partiellement (Home + User seulement)"
    echo "3) 🔧 Migrer KPI vers l'API"
    echo "4) 🔧 Migrer Overview vers l'API"
    echo "5) ⏪ ROLLBACK - Revenir aux versions SQL"
    echo "6) 📊 Afficher l'état actuel"
    echo "0) Quitter"
    echo ""
    read -p "Votre choix [0-6]: " choice
}

# Fonction pour vérifier l'état
check_status() {
    echo ""
    echo "📊 État actuel de la migration"
    echo "=============================="
    echo ""
    
    if [ -f "$CONTROLLER_DIR/home_controller_api.php" ]; then
        echo "✅ Home Controller : VERSION API ACTIVE"
    else
        echo "🔴 Home Controller : VERSION SQL ACTIVE"
    fi
    
    if [ -f "$CONTROLLER_DIR/user_controller_sql.php" ]; then
        echo "✅ User Controller : VERSION API ACTIVE"
    else
        echo "🔴 User Controller : VERSION SQL ACTIVE"
    fi
    
    if [ -f "$VIEW_DIR/user_sql.php" ]; then
        echo "✅ User View : VERSION API ACTIVE"
    else
        echo "🔴 User View : VERSION SQL ACTIVE"
    fi
    
    if [ -f "$CONTROLLER_DIR/kpi_controller_sql.php" ]; then
        echo "✅ KPI Controller : VERSION API ACTIVE"
    else
        echo "🔴 KPI Controller : VERSION SQL ACTIVE"
    fi
    
    if [ -f "$CONTROLLER_DIR/overview_controller_sql.php" ]; then
        echo "✅ Overview Controller : VERSION API ACTIVE"
    else
        echo "🔴 Overview Controller : VERSION SQL ACTIVE"
    fi
    
    echo ""
}

# Migration complète
migrate_all() {
    echo ""
    echo "🚀 Migration complète vers l'API..."
    echo ""
    
    # User controller
    if [ -f "$CONTROLLER_DIR/user_controller.php" ] && [ ! -f "$CONTROLLER_DIR/user_controller_sql.php" ]; then
        echo "→ Migration User Controller..."
        mv "$CONTROLLER_DIR/user_controller.php" "$CONTROLLER_DIR/user_controller_sql.php"
        mv "$CONTROLLER_DIR/user_controller_api.php" "$CONTROLLER_DIR/user_controller.php"
        echo "  ✅ User Controller migré"
    else
        echo "  ⏭️  User Controller déjà migré"
    fi
    
    # User view
    if [ -f "$VIEW_DIR/user.php" ] && [ ! -f "$VIEW_DIR/user_sql.php" ]; then
        echo "→ Migration User View..."
        mv "$VIEW_DIR/user.php" "$VIEW_DIR/user_sql.php"
        mv "$VIEW_DIR/user_api.php" "$VIEW_DIR/user.php"
        echo "  ✅ User View migré"
    else
        echo "  ⏭️  User View déjà migré"
    fi
    
    # KPI controller
    if [ -f "$CONTROLLER_DIR/kpi_controller.php" ] && [ ! -f "$CONTROLLER_DIR/kpi_controller_sql.php" ]; then
        echo "→ Migration KPI Controller..."
        mv "$CONTROLLER_DIR/kpi_controller.php" "$CONTROLLER_DIR/kpi_controller_sql.php"
        mv "$CONTROLLER_DIR/kpi_controller_api.php" "$CONTROLLER_DIR/kpi_controller.php"
        echo "  ✅ KPI Controller migré"
    else
        echo "  ⏭️  KPI Controller déjà migré"
    fi
    
    # Overview controller
    if [ -f "$CONTROLLER_DIR/overview_controller.php" ] && [ ! -f "$CONTROLLER_DIR/overview_controller_sql.php" ]; then
        echo "→ Migration Overview Controller..."
        mv "$CONTROLLER_DIR/overview_controller.php" "$CONTROLLER_DIR/overview_controller_sql.php"
        mv "$CONTROLLER_DIR/overview_controller_api.php" "$CONTROLLER_DIR/overview_controller.php"
        echo "  ✅ Overview Controller migré"
    else
        echo "  ⏭️  Overview Controller déjà migré"
    fi
    
    echo ""
    echo "✅ Migration complète terminée !"
    echo ""
}

# Migration partielle (Home + User)
migrate_partial() {
    echo ""
    echo "🟡 Migration partielle (Home + User uniquement)..."
    echo ""
    
    # User controller
    if [ -f "$CONTROLLER_DIR/user_controller.php" ] && [ ! -f "$CONTROLLER_DIR/user_controller_sql.php" ]; then
        echo "→ Migration User Controller..."
        mv "$CONTROLLER_DIR/user_controller.php" "$CONTROLLER_DIR/user_controller_sql.php"
        mv "$CONTROLLER_DIR/user_controller_api.php" "$CONTROLLER_DIR/user_controller.php"
        echo "  ✅ User Controller migré"
    else
        echo "  ⏭️  User Controller déjà migré"
    fi
    
    # User view
    if [ -f "$VIEW_DIR/user.php" ] && [ ! -f "$VIEW_DIR/user_sql.php" ]; then
        echo "→ Migration User View..."
        mv "$VIEW_DIR/user.php" "$VIEW_DIR/user_sql.php"
        mv "$VIEW_DIR/user_api.php" "$VIEW_DIR/user.php"
        echo "  ✅ User View migré"
    else
        echo "  ⏭️  User View déjà migré"
    fi
    
    echo ""
    echo "✅ Migration partielle terminée !"
    echo "⚠️  KPI et Overview utilisent toujours la version SQL"
    echo ""
}

# Migration KPI
migrate_kpi() {
    echo ""
    echo "🔧 Migration KPI Controller..."
    echo ""
    
    if [ -f "$CONTROLLER_DIR/kpi_controller.php" ] && [ ! -f "$CONTROLLER_DIR/kpi_controller_sql.php" ]; then
        mv "$CONTROLLER_DIR/kpi_controller.php" "$CONTROLLER_DIR/kpi_controller_sql.php"
        mv "$CONTROLLER_DIR/kpi_controller_api.php" "$CONTROLLER_DIR/kpi_controller.php"
        echo "✅ KPI Controller migré vers l'API"
    else
        echo "⏭️  KPI Controller déjà migré"
    fi
    echo ""
}

# Migration Overview
migrate_overview() {
    echo ""
    echo "🔧 Migration Overview Controller..."
    echo ""
    
    if [ -f "$CONTROLLER_DIR/overview_controller.php" ] && [ ! -f "$CONTROLLER_DIR/overview_controller_sql.php" ]; then
        mv "$CONTROLLER_DIR/overview_controller.php" "$CONTROLLER_DIR/overview_controller_sql.php"
        mv "$CONTROLLER_DIR/overview_controller_api.php" "$CONTROLLER_DIR/overview_controller.php"
        echo "✅ Overview Controller migré vers l'API"
    else
        echo "⏭️  Overview Controller déjà migré"
    fi
    echo ""
}

# Rollback complet
rollback_all() {
    echo ""
    read -p "⚠️  Êtes-vous sûr de vouloir revenir aux versions SQL ? (y/N): " confirm
    
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        echo "Annulé."
        return
    fi
    
    echo ""
    echo "⏪ Rollback vers versions SQL..."
    echo ""
    
    # User controller
    if [ -f "$CONTROLLER_DIR/user_controller_sql.php" ]; then
        echo "→ Rollback User Controller..."
        mv "$CONTROLLER_DIR/user_controller.php" "$CONTROLLER_DIR/user_controller_api.php"
        mv "$CONTROLLER_DIR/user_controller_sql.php" "$CONTROLLER_DIR/user_controller.php"
        echo "  ✅ User Controller restauré"
    fi
    
    # User view
    if [ -f "$VIEW_DIR/user_sql.php" ]; then
        echo "→ Rollback User View..."
        mv "$VIEW_DIR/user.php" "$VIEW_DIR/user_api.php"
        mv "$VIEW_DIR/user_sql.php" "$VIEW_DIR/user.php"
        echo "  ✅ User View restauré"
    fi
    
    # KPI controller
    if [ -f "$CONTROLLER_DIR/kpi_controller_sql.php" ]; then
        echo "→ Rollback KPI Controller..."
        mv "$CONTROLLER_DIR/kpi_controller.php" "$CONTROLLER_DIR/kpi_controller_api.php"
        mv "$CONTROLLER_DIR/kpi_controller_sql.php" "$CONTROLLER_DIR/kpi_controller.php"
        echo "  ✅ KPI Controller restauré"
    fi
    
    # Overview controller
    if [ -f "$CONTROLLER_DIR/overview_controller_sql.php" ]; then
        echo "→ Rollback Overview Controller..."
        mv "$CONTROLLER_DIR/overview_controller.php" "$CONTROLLER_DIR/overview_controller_api.php"
        mv "$CONTROLLER_DIR/overview_controller_sql.php" "$CONTROLLER_DIR/overview_controller.php"
        echo "  ✅ Overview Controller restauré"
    fi
    
    echo ""
    echo "✅ Rollback terminé - Versions SQL restaurées"
    echo ""
}

# Boucle principale
while true; do
    show_menu
    
    case $choice in
        1)
            migrate_all
            ;;
        2)
            migrate_partial
            ;;
        3)
            migrate_kpi
            ;;
        4)
            migrate_overview
            ;;
        5)
            rollback_all
            ;;
        6)
            check_status
            ;;
        0)
            echo "Au revoir ! 👋"
            exit 0
            ;;
        *)
            echo "Choix invalide"
            ;;
    esac
    
    echo ""
    read -p "Appuyez sur Entrée pour continuer..."
    clear
done
