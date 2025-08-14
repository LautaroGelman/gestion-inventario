// backend/src/main/java/grupo5/gestion_inventario/model/Employee.java
package grupo5.gestion_inventario.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import grupo5.gestion_inventario.clientpanel.model.HoursWorked;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "employees")
@Getter @Setter
@NoArgsConstructor
public class Employee implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    private EmployeeRole role;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    @JsonIgnore
    private Client client;

    /* NUEVO: sucursal a la que pertenece (null para PROPIETARIO) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sucursal_id")
    @JsonIgnore
    private Sucursal sucursal;

    /* Horas trabajadas */
    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<HoursWorked> hoursWorked;

    /* --- constructores --- */
    public Employee(String name, String email, String passwordHash,
                    EmployeeRole role, Client client, Sucursal sucursal) {
        this.name         = name;
        this.email        = email;
        this.passwordHash = passwordHash;
        this.role         = role;
        this.client       = client;
        this.sucursal     = sucursal;
    }

    /* --- UserDetails --- */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        switch (this.role) {
            case CAJERO:
                return List.of(new SimpleGrantedAuthority("ROLE_CAJERO"));
            case INVENTARIO:
                return List.of(new SimpleGrantedAuthority("ROLE_INVENTARIO"));
            case VENTAS_INVENTARIO:
                return List.of(new SimpleGrantedAuthority("ROLE_CAJERO"),
                        new SimpleGrantedAuthority("ROLE_INVENTARIO"));
            case MULTIFUNCION:
                return List.of(new SimpleGrantedAuthority("ROLE_CAJERO"),
                        new SimpleGrantedAuthority("ROLE_INVENTARIO"));
            case PROPIETARIO:
                return List.of(new SimpleGrantedAuthority("ROLE_PROPIETARIO"));
            default: /* ADMINISTRADOR */
                return List.of(new SimpleGrantedAuthority("ROLE_ADMINISTRADOR"));
        }
    }

    @Override public String getUsername()            { return email; }
    @Override public String getPassword()            { return passwordHash; }
    @Override public boolean isAccountNonExpired()   { return true; }
    @Override public boolean isAccountNonLocked()    { return true; }
    @Override public boolean isCredentialsNonExpired(){ return true; }
    @Override public boolean isEnabled()             { return true; }
}
