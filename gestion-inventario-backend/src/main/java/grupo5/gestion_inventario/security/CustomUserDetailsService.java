package grupo5.gestion_inventario.security;

import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.model.Employee;
import grupo5.gestion_inventario.model.EmployeeRole;
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

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
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
        // 1. Intentar como AdminUser del superpanel
        Optional<AdminUser> adminOpt = adminUserRepository.findByUsername(username);
        if (adminOpt.isPresent()) {
            AdminUser admin = adminOpt.get();
            var authorities = admin.getRoles().stream()
                    .map(SimpleGrantedAuthority::new)
                    .collect(Collectors.toList());
            return new User(admin.getUsername(), admin.getPasswordHash(), authorities);
        }

        // 2. Intentar como Employee (cajero, administrador, multifunción)
        Optional<Employee> employeeOpt = employeeRepository.findByEmail(username);
        if (employeeOpt.isPresent()) {
            Employee employee = employeeOpt.get();
            List<SimpleGrantedAuthority> authorities = new ArrayList<>();
            // Rol principal de employee: ROLE_ADMINISTRADOR, ROLE_CAJERO o ROLE_MULTIFUNCION
            String empRole = "ROLE_" + employee.getRole().name();
            authorities.add(new SimpleGrantedAuthority(empRole));
            // Si es ADMINISTRADOR, también le damos permiso de CLIENT
            if (employee.getRole() == EmployeeRole.ADMINISTRADOR) {
                authorities.add(new SimpleGrantedAuthority("ROLE_CLIENT"));
            }
            return User.builder()
                    .username(employee.getEmail())
                    .password(employee.getPassword())
                    .authorities(authorities)
                    .build();
        }

        // 3. Intentar como Client (dueño de negocio)
        Optional<Client> clientOpt = clientRepository.findByEmail(username);
        if (clientOpt.isPresent()) {
            Client client = clientOpt.get();
            // El propietario recibe solo ROLE_CLIENT
            return User.builder()
                    .username(client.getEmail())
                    .password(client.getPasswordHash())
                    .authorities(Collections.singletonList(
                            new SimpleGrantedAuthority("ROLE_CLIENT")
                    ))
                    .build();
        }

        throw new UsernameNotFoundException("Usuario no encontrado: " + username);
    }
}
