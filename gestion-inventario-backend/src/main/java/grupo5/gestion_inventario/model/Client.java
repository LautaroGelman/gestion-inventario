// backend/src/main/java/grupo5/gestion_inventario/model/Client.java
package grupo5.gestion_inventario.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "client")
@Getter @Setter
@NoArgsConstructor
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;                // usado como username

    @Column(nullable = false)
    private String passwordHash;

    @Column(precision = 5, scale = 2)
    private BigDecimal taxPercentage;

    private String telefono;
    private String plan;
    private String estado;

    /* --- relaciones --- */

    @OneToMany(mappedBy = "client", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Product> products = new ArrayList<>();

    @OneToMany(mappedBy = "client", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private Set<Employee> employees;

    @OneToMany(mappedBy = "client", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Sucursal> sucursales = new ArrayList<>();

    /* conveniencia */

    public void addSucursal(Sucursal sucursal) {
        sucursales.add(sucursal);
        sucursal.setClient(this);
    }
}
