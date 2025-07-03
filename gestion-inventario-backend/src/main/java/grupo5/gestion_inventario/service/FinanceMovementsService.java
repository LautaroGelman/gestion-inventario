package grupo5.gestion_inventario.service;

import grupo5.gestion_inventario.clientpanel.dto.ExpenseMovementDto;
import grupo5.gestion_inventario.clientpanel.model.Expense;
import grupo5.gestion_inventario.clientpanel.repository.ExpenseRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FinanceMovementsService {

    private final ExpenseRepository expenseRepo;

    public List<ExpenseMovementDto> findMovements(
            Long clientId, LocalDate from, LocalDate to) {

        List<Expense> list = expenseRepo.findByClientIdAndDateBetweenOrderByDateAsc(
                clientId, from, to);

        return list.stream()
                .map(ExpenseMovementDto::fromEntity)
                .collect(Collectors.toList());
    }
}
