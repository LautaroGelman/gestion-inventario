package grupo5.gestion_inventario.repository;

import grupo5.gestion_inventario.model.Employee;
import grupo5.gestion_inventario.model.EmployeeRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    Optional<Employee> findByEmail(String email);

    boolean existsByEmail(String email);

    List<Employee> findByClientId(Long clientId);

    Optional<Employee> findByClientIdAndRole(Long clientId, EmployeeRole role);
}
