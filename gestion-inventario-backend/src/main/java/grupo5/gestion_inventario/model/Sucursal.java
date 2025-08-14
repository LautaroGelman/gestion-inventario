// backend/src/main/java/grupo5/gestion_inventario/model/Sucursal.java
package grupo5.gestion_inventario.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.Objects;

@Entity
@Table(name = "sucursales")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class Sucursal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String address;

    private boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    @JsonIgnore       // evita bucles en la serialización
    private Client client;

    // constructor de conveniencia
    public Sucursal(String name, String address, Client client) {
        this.name = name;
        this.address = address;
        this.client  = client;
    }

    /* equals/hashCode basados solo en id para entidades JPA */
    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Sucursal)) return false;
        return id != null && id.equals(((Sucursal) o).id);
    }
    @Override public int hashCode() { return Objects.hashCode(id); }
}
