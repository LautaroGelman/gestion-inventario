// src/main/java/grupo5/gestion_inventario/clientpanel/dto/EmployeeDto.java
package grupo5.gestion_inventario.clientpanel.dto;

import grupo5.gestion_inventario.model.Employee;

public class EmployeeDto {
    private Long id;
    private String name;
    private String email;
    private String role;

    public EmployeeDto() {}
    public EmployeeDto(Long id, String name, String email, String role) {
        this.id    = id;
        this.name  = name;
        this.email = email;
        this.role  = role;
    }

    public static EmployeeDto fromEntity(Employee e) {
        return new EmployeeDto(
                e.getId(), e.getName(), e.getEmail(), e.getRole().name()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }
}
