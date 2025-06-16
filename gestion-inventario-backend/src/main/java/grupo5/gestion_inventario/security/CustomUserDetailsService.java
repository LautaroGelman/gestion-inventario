package grupo5.gestion_inventario.security;

import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.model.Employee;
import grupo5.gestion_inventario.repository.ClientRepository;
import grupo5.gestion_inventario.repository.EmployeeRepository;
import grupo5.gestion_inventario.superpanel.model.AdminUser;
import grupo5.gestion_inventario.superpanel.repository.AdminUserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Optional;
import java.util.stream.Collectors;

@Service("customUserDetailsService")
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private AdminUserRepository adminUserRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // 1. Intentar como Admin
        Optional<AdminUser> adminOpt = adminUserRepository.findByUsername(username);
        if (adminOpt.isPresent()) {
            AdminUser admin = adminOpt.get();
            // ¡CAMBIO CLAVE! Leemos los roles desde la base de datos a través de la entidad
            var authorities = admin.getRoles().stream()
                    .map(SimpleGrantedAuthority::new)
                    .collect(Collectors.toList());
            return new User(admin.getUsername(), admin.getPasswordHash(), authorities);
        }

        // 2. Intentar como Employee
        Optional<Employee> employeeOpt = employeeRepository.findByEmail(username);
        if (employeeOpt.isPresent()) {
            Employee employee = employeeOpt.get();
            String authority = "ROLE_" + employee.getRole().name();
            return User.builder()
                    .username(employee.getEmail())
                    .password(employee.getPassword())
                    .authorities(authority)
                    .build();
        }

        // 3. Intentar como Client
        Optional<Client> clientOpt = clientRepository.findByEmail(username);
        if (clientOpt.isPresent()) {
            Client client = clientOpt.get();
            return new User(client.getEmail(), client.getPasswordHash(),
                    Collections.singletonList(new SimpleGrantedAuthority("ROLE_CLIENT")));
        }

        throw new UsernameNotFoundException("Usuario no encontrado: " + username);
    }
}
