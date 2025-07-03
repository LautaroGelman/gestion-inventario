package grupo5.gestion_inventario.model;

import org.springframework.security.core.GrantedAuthority;

public enum EmployeeRole implements GrantedAuthority {
    ADMINISTRADOR,
    CAJERO,
    INVENTARIO,
    VENTAS_INVENTARIO,
    MULTIFUNCION;

    @Override
    public String getAuthority() {
        return this.name();
    }
}
