// src/main/java/grupo5/gestion_inventario/clientpanel/dto/CreateEmployeeRequest.java
package grupo5.gestion_inventario.clientpanel.dto;

import grupo5.gestion_inventario.model.EmployeeRole;

public class CreateEmployeeRequest {
    private String name;
    private String email;
    private String password;
    private EmployeeRole role;

    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }
    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }
    public void setPassword(String password) {
        this.password = password;
    }

    public EmployeeRole getRole() {
        return role;
    }
    public void setRole(EmployeeRole role) {
        this.role = role;
    }
}

