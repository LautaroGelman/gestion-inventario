// src/main/java/grupo5/gestion_inventario/clientpanel/dto/UpdateEmployeeRequest.java
package grupo5.gestion_inventario.clientpanel.dto;

import grupo5.gestion_inventario.model.EmployeeRole;

public class UpdateEmployeeRequest {
    private String name;
    private String passwordHash; // opcional
    private EmployeeRole role;

    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }

    public String getPasswordHash() {
        return passwordHash;
    }
    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public EmployeeRole getRole() {
        return role;
    }
    public void setRole(EmployeeRole role) {
        this.role = role;
    }
}
