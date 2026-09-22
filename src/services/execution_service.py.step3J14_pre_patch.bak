import time
import uuid
import json
import asyncio
import logging
from src.services.execution_guard_service import execution_guard_service
import MetaTrader5 as mt5
from src.services.mt5_bridge_service import mt5_bridge_service
from src.services.mt5_service import mt5_service
from src.services.risk_service import risk_engine_service
from src.services.oms_service import oms_service
from src.services.position_service import position_service
from src.services.database_service import database_service
import os
logger = logging.getLogger('volsim.execution_service')

class ExecutionService:
    """
    Enterprise Execution Service.

    Owns:
    - execution health
    - bridge connectivity
    - broker connectivity
    - order execution telemetry

    Does NOT own:
    - portfolio calculations
    - risk calculations
    - statistics
    - AI decisions
    - vault logic
    """

    def __init__(self):
        self.started_at = time.time()
        self.orders_sent = 0
        self.orders_filled = 0
        self.orders_rejected = 0
        self.last_order_time = None
        self.last_fill_time = None
        self.last_error = None
        self.execution_latency_ms = 0
        configured_mode = os.getenv('VOLSIM_EXECUTION_MODE', 'PAPER').strip().upper()
        if configured_mode not in {'PAPER', 'LIVE'}:
            logger.warning('Invalid VOLSIM_EXECUTION_MODE=%r; falling back to PAPER.', configured_mode)
            configured_mode = 'PAPER'
        self.execution_mode = configured_mode

    async def _claim_execution_idempotency(self, client_order_id: str):
        """
        Atomically claim an execution identity in PostgreSQL.

        Returns:
            (True, None) when this request successfully owns the identity.

            (False, previous_result) when the identity already exists.
        """
        if not client_order_id:
            return (True, None)
        row = await database_service.fetchrow("\n            INSERT INTO execution_idempotency\n            (\n                client_order_id,\n                execution_mode,\n                status\n            )\n            VALUES\n            (\n                $1,\n                $2,\n                'IN_PROGRESS'\n            )\n            ON CONFLICT (client_order_id)\n            DO NOTHING\n            RETURNING\n                client_order_id,\n                execution_mode,\n                status,\n                result,\n                created_at,\n                updated_at\n            ", client_order_id, self.execution_mode)
        if row is not None:
            logger.info('Durable execution identity claimed: client_order_id=%s', client_order_id)
            return (True, None)
        existing = await database_service.fetchrow('\n            SELECT\n                client_order_id,\n                oms_order_id,\n                execution_mode,\n                status,\n                broker_order_ticket,\n                broker_deal_ticket,\n                broker_position_ticket,\n                retcode,\n                result,\n                created_at,\n                updated_at\n            FROM execution_idempotency\n            WHERE client_order_id = $1\n            ', client_order_id)
        previous_result = dict(existing) if existing is not None else None
        logger.warning('Duplicate execution prevented by PostgreSQL: client_order_id=%s', client_order_id)
        return (False, previous_result)

    async def _finalize_execution_idempotency(self, client_order_id: str, result: dict, oms_order_id=None):
        """
        Persist the final execution lifecycle result.
        """
        if not client_order_id:
            return
        broker_order_ticket = result.get('order_ticket')
        broker_deal_ticket = result.get('deal_ticket')
        broker_position_ticket = result.get('position_ticket')
        retcode = result.get('retcode')
        status = 'SUCCESS' if result.get('success') else 'FAILED'
        await database_service.execute('\n            UPDATE execution_idempotency\n            SET\n                oms_order_id = $2,\n                status = $3,\n                broker_order_ticket = $4,\n                broker_deal_ticket = $5,\n                broker_position_ticket = $6,\n                retcode = $7,\n                result = $8::jsonb,\n                updated_at = NOW()\n            WHERE client_order_id = $1\n            ', client_order_id, str(oms_order_id) if oms_order_id else None, status, broker_order_ticket, broker_deal_ticket, broker_position_ticket, str(retcode) if retcode is not None else None, json.dumps(result, default=str))
        logger.info('Durable execution identity finalized: client_order_id=%s oms_order_id=%s status=%s retcode=%s', client_order_id, oms_order_id, status, retcode)

    async def _release_execution_idempotency(self, client_order_id: str):
        """
        Release an execution identity only when broker transmission
        has NOT occurred.

        This allows a request rejected before order_send() to be
        retried using the same client_order_id.

        Once order_send() has occurred, the identity remains durable.
        """
        if not client_order_id:
            return
        result = await database_service.execute("\n            DELETE FROM execution_idempotency\n            WHERE client_order_id = $1\n              AND status = 'IN_PROGRESS'\n            ", client_order_id)
        logger.info('Durable execution identity released: client_order_id=%s result=%s', client_order_id, result)

    def _build_execution_result(
        self,
        *,
        success: bool,
        order_id=None,
        client_order_id=None,
        execution_mode=None,
        status=None,
        trade_id=None,
        order_ticket=None,
        deal_ticket=None,
        position_ticket=None,
        retcode=None,
        broker_retcode=None,
        comment=None,
        message=None,
        symbol=None,
        side=None,
        volume=None,
        price=None,
        retryable=None,
        reconciliation_required=False,
        broker_transmission_started=False,
        order_check_retcode=None,
        order_check_comment=None,
        order_check_passed=None,
        **extra,
    ):
        """
        Canonical execution result contract.

        Once broker transmission has started, automatic retry is unsafe
        unless broker reconciliation establishes the final state.
        """

        if retryable is None:
            retryable = (
                not broker_transmission_started
                and not reconciliation_required
            )

        result = {
            "success": bool(success),
            "status": status,
            "execution_mode": execution_mode or self.execution_mode,

            "order_id": order_id,
            "oms_order_id": order_id,
            "client_order_id": client_order_id,

            "trade_id": trade_id,

            "order_ticket": order_ticket,
            "deal_ticket": deal_ticket,
            "position_ticket": position_ticket,
            "ticket": order_ticket,

            "retcode": retcode,
            "broker_retcode": broker_retcode,
            "comment": comment,
            "message": message,

            "symbol": symbol,
            "side": side,
            "volume": volume,
            "price": price,

            "retryable": bool(retryable),
            "reconciliation_required": bool(
                reconciliation_required
            ),
            "broker_transmission_started": bool(
                broker_transmission_started
            ),

            "order_check_retcode": order_check_retcode,
            "order_check_comment": order_check_comment,
            "order_check_passed": order_check_passed,
        }

        result.update(extra)

        return result

    async def send_order(self, order_request: dict):
        start = time.time()
        broker_transmission_started = False
        client_order_id = order_request.get('client_order_id') or order_request.get('idempotency_key') or 'VOLSIM-' + uuid.uuid4().hex
        order_request['client_order_id'] = client_order_id
        claimed, previous_result = await self._claim_execution_idempotency(client_order_id)
        if not claimed:
            previous_execution_result = previous_result.get('result') if previous_result else None
            if not isinstance(previous_execution_result, dict):
                previous_execution_result = {}

            duplicate_result = {
                'success': False,
                'order_id': previous_execution_result.get('order_id'),
                'ticket': previous_execution_result.get('ticket'),
                'retcode': 'DUPLICATE_EXECUTION',
                'message': 'Execution rejected because client_order_id has already been claimed.',
                'client_order_id': client_order_id,
                'execution_mode': self.execution_mode
            }
            return duplicate_result
        order = oms_service.create_order(order_request)
        order_id = order['order_id']
        try:
            live_transmission_authorized = order_request.get('live_transmission_authorized') is True
            if not live_transmission_authorized:
                self.orders_rejected += 1
                self.last_error = 'LIVE_TRANSMISSION_NOT_AUTHORIZED'
                authorization_result = {'success': False, 'order_id': order_id, 'ticket': None, 'retcode': 'LIVE_TRANSMISSION_NOT_AUTHORIZED', 'message': 'Live broker transmission requires explicit authorization.', 'client_order_id': client_order_id, 'execution_mode': self.execution_mode, 'live_transmission_authorized': False}
                logger.warning('LIVE TRANSMISSION DENIED: explicit authorization was not provided. oms_order_id=%s client_order_id=%s', order_id, client_order_id)
                oms_service.update_status(order_id, 'REJECTED', authorization_result)
                await self._finalize_execution_idempotency(client_order_id, authorization_result, order_id)
                return authorization_result
            risk_result = risk_engine_service.approve_order(order_request)
            if not risk_result.get('approved'):
                self.orders_rejected += 1
                self.last_error = risk_result.get('reason', 'Risk rejected')
                oms_service.update_status(order_id, 'REJECTED', risk_result)
                await self._release_execution_idempotency(client_order_id)
                return {'success': False, 'order_id': order_id, 'reason': self.last_error, 'risk': risk_result}
            try:
                guard_symbol = str(order_request.get('symbol', ''))
                guard_action = str(order_request.get('action', order_request.get('type', order_request.get('side', '')))).upper().strip()
                strategy_signal = order_request.get('strategy_signal') or order_request.get('signal')
                market_context_result = execution_guard_service.evaluate(symbol=guard_symbol, action=guard_action, strategy_signal=strategy_signal)
            except Exception as guard_error:
                logger.exception('Market context guard failure: %s', guard_error)
                market_context_result = {'allowed': False, 'status': 'GUARD_ERROR', 'reason': 'Execution guard failed: ' + str(guard_error)}
            guard_allowed = bool(market_context_result.get('allowed', False))
            guard_status = str(market_context_result.get('status', 'UNKNOWN'))
            guard_reason = str(market_context_result.get('reason', ''))
            if not guard_allowed:
                self.orders_rejected += 1
                self.last_error = 'MARKET_CONTEXT_REJECTED: ' + guard_reason
                rejection_result = {'success': False, 'order_id': order_id, 'ticket': None, 'retcode': 'MARKET_CONTEXT_REJECTED', 'message': self.last_error, 'guard_status': guard_status, 'guard_reason': guard_reason, 'market_context': market_context_result, 'execution_mode': self.execution_mode}
                oms_service.update_status(order_id, 'REJECTED', rejection_result)
                logger.warning('Order rejected by market context guard: oms_order_id=%s symbol=%s action=%s reason=%s', order_id, guard_symbol, guard_action, guard_reason)
                return rejection_result
            logger.info('Market context guard APPROVED: oms_order_id=%s symbol=%s action=%s status=%s', order_id, guard_symbol, guard_action, guard_status)
            if self.execution_mode == 'PAPER':
                import uuid
                paper_trade_id = 'PAPER-' + uuid.uuid4().hex
                execution_price = float(order_request.get('price', 0.0) or 0.0)
                self.orders_sent += 1
                self.orders_filled += 1
                self.last_order_time = time.time()
                self.last_fill_time = time.time()
                self.execution_latency_ms = round((time.time() - start) * 1000, 2)
                result = {'success': True, 'mode': 'PAPER', 'oms_order_id': order_id, 'trade_id': paper_trade_id, 'position_ticket': None, 'order_ticket': None, 'deal_ticket': None, 'ticket': paper_trade_id, 'retcode': 'SIMULATED_FILL', 'symbol': order_request.get('symbol', ''), 'side': order_request.get('type', order_request.get('side', '')), 'volume': float(order_request.get('volume', 0.01) or 0.01), 'price': execution_price, 'comment': order_request.get('comment', 'VolSim-Pro PAPER')}
                oms_service.update_status(order_id, 'FILLED', result)
                position = await position_service.open_position(paper_trade_id, order_request, result)
                logger.info('PAPER position registered: oms_order_id=%s trade_id=%s symbol=%s side=%s volume=%s price=%s', order_id, paper_trade_id, order_request.get('symbol'), order_request.get('type'), order_request.get('volume'), execution_price)
                await self._finalize_execution_idempotency(client_order_id, {**result, 'order_id': order_id, 'trade_id': paper_trade_id, 'client_order_id': client_order_id, 'execution_mode': self.execution_mode}, order_id)
                return {'order_id': order_id, 'trade_id': paper_trade_id, 'position': position, **result}
            request = {'action': mt5.TRADE_ACTION_DEAL, 'symbol': order_request.get('symbol'), 'volume': order_request.get('volume', 0.01), 'type': mt5.ORDER_TYPE_BUY if order_request.get('type') == 'BUY' else mt5.ORDER_TYPE_SELL, 'price': order_request.get('price', 0), 'sl': order_request.get('stop_loss', 0), 'tp': order_request.get('take_profit', 0), 'deviation': 20, 'magic': 202607, 'type_filling': mt5.ORDER_FILLING_IOC, 'comment': 'VolSim-Pro'}
            try:
                order_check_result = mt5.order_check(request)
            except Exception as order_check_error:
                logger.exception('MT5 order_check() exception: %s', order_check_error)
                self.orders_rejected += 1
                self.last_error = 'MT5_ORDER_CHECK_EXCEPTION: ' + str(order_check_error)
                oms_service.update_status(order_id, 'REJECTED', {'success': False, 'retcode': 'ORDER_CHECK_EXCEPTION', 'message': self.last_error})
                await self._release_execution_idempotency(client_order_id)
                return {'success': False, 'order_id': order_id, 'ticket': None, 'retcode': 'ORDER_CHECK_EXCEPTION', 'message': self.last_error}
            if order_check_result is None:
                self.orders_rejected += 1
                self.last_error = 'MT5_ORDER_CHECK_FAILED: No response from MT5'
                oms_service.update_status(order_id, 'REJECTED', {'success': False, 'retcode': 'ORDER_CHECK_NO_RESPONSE', 'message': self.last_error})
                await self._release_execution_idempotency(client_order_id)
                return {'success': False, 'order_id': order_id, 'ticket': None, 'retcode': 'ORDER_CHECK_NO_RESPONSE', 'message': self.last_error}
            order_check_retcode = getattr(order_check_result, 'retcode', None)
            order_check_comment = getattr(order_check_result, 'comment', '')
            logger.info('MT5 order_check() result: retcode=%s comment=%s', order_check_retcode, order_check_comment)
            if order_check_retcode != 0:
                self.orders_rejected += 1
                self.last_error = f'MT5_ORDER_CHECK_REJECTED: retcode={order_check_retcode} comment={order_check_comment}'
                oms_service.update_status(order_id, 'REJECTED', {'success': False, 'retcode': 'ORDER_CHECK_REJECTED', 'broker_retcode': order_check_retcode, 'broker_comment': order_check_comment, 'message': self.last_error})
                await self._release_execution_idempotency(client_order_id)
                return {'success': False, 'order_id': order_id, 'ticket': None, 'retcode': 'ORDER_CHECK_REJECTED', 'broker_retcode': order_check_retcode, 'comment': order_check_comment, 'message': self.last_error}
            logger.info('MT5 order_check() PASSED. Proceeding to order_send(): oms_order_id=%s symbol=%s', order_id, order_request.get('symbol'))
            broker_transmission_started = True
            result = mt5.order_send(request)
            self.orders_sent += 1
            self.last_order_time = time.time()
            self.execution_latency_ms = round((time.time() - start) * 1000, 2)
            if result is None:
                self.orders_rejected += 1
                self.last_error = 'No response from MT5'
                return {'success': False, 'ticket': None, 'message': self.last_error}
            if result.retcode == mt5.TRADE_RETCODE_DONE:
                self.orders_filled += 1
                self.last_fill_time = time.time()
                order_ticket = getattr(result, 'order', None)
                deal_ticket = getattr(result, 'deal', None)
                position_ticket = self._resolve_broker_position_ticket(symbol=order_request.get('symbol', ''), magic=order_request.get('magic', 202607), order_ticket=order_ticket, deal_ticket=deal_ticket)
                execution_result = {'success': True, 'oms_order_id': order_id, 'position_ticket': position_ticket, 'ticket': order_ticket, 'order_ticket': order_ticket, 'deal_ticket': deal_ticket, 'retcode': result.retcode, 'comment': getattr(result, 'comment', ''), 'symbol': order_request.get('symbol', ''), 'side': order_request.get('side', order_request.get('order_type', '')), 'volume': float(getattr(result, 'volume', order_request.get('volume', 0.01))), 'price': float(getattr(result, 'price', order_request.get('price', 0)))}
                oms_service.update_status(order_id, 'FILLED', execution_result)
                await self.record_trade_ledger(order_request, execution_result, 'FILLED', oms_order_id=order_id)
                live_trade_id = position_ticket or str(order_ticket) or str(order_id)
                execution_result['trade_id'] = str(live_trade_id)
                position = await position_service.open_position(str(live_trade_id), order_request, execution_result)
                await position_service.persist_snapshot(position)
                logger.info('LIVE position registered: oms_order_id=%s trade_id=%s position_ticket=%s order_ticket=%s deal_ticket=%s', order_id, live_trade_id, position_ticket, order_ticket, deal_ticket)
                await self._finalize_execution_idempotency(client_order_id, {**execution_result, 'order_id': order_id, 'trade_id': str(live_trade_id), 'client_order_id': client_order_id, 'execution_mode': self.execution_mode}, order_id)
                return {'order_id': order_id, 'trade_id': str(live_trade_id), **execution_result}
            self.orders_rejected += 1
            self.last_error = str(result.retcode)
            await self._finalize_execution_idempotency(client_order_id, {'success': False, 'order_id': order_id, 'ticket': None, 'retcode': result.retcode, 'message': self.last_error, 'client_order_id': client_order_id, 'execution_mode': self.execution_mode}, order_id)
            return {'success': False, 'ticket': None, 'retcode': result.retcode, 'message': self.last_error}
        except Exception as e:
            self.orders_rejected += 1
            self.last_error = str(e)
            logger.error('Order execution failed: %s', e)
            oms_service.update_status(order_id, 'FAILED', {'error': str(e)})
            if broker_transmission_started:
                exception_retcode = 'TRANSMISSION_UNKNOWN'
                exception_message = 'Broker transmission started but execution result could not be established safely. Broker reconciliation is required before retry.'
                logger.critical('TRANSMISSION_UNKNOWN: oms_order_id=%s client_order_id=%s error=%s', order_id, client_order_id, e)
            else:
                exception_retcode = 'EXECUTION_EXCEPTION'
                exception_message = str(e)
            await self._finalize_execution_idempotency(client_order_id, {'success': False, 'order_id': order_id, 'ticket': None, 'retcode': exception_retcode, 'message': exception_message, 'client_order_id': client_order_id, 'execution_mode': self.execution_mode}, order_id)
            return {'success': False, 'order_id': order_id, 'ticket': None, 'message': str(e)}

    async def record_trade_ledger(self, order_request: dict, result: dict, status: str, oms_order_id: str | None=None) -> bool:
        """
        Persist an execution event into the durable trade ledger.

        Identity model:

            OMS order
                |
                +-- oms_order_id
                |
                +-- broker_order_ticket
                |
                +-- broker_deal_ticket
                |
                +-- broker_position_ticket

        MT5 remains authoritative for broker state.
        PostgreSQL remains authoritative for durable execution history.
        """
        try:
            broker_order_ticket = result.get('order_ticket')
            broker_deal_ticket = result.get('deal_ticket')
            broker_position_ticket = result.get('position_ticket')
            trade_id = result.get('trade_id') or broker_position_ticket or broker_order_ticket or result.get('ticket') or 'UNKNOWN'
            await database_service.execute('\n                INSERT INTO trade_ledger\n                (\n                    id,\n                    trade_id,\n                    oms_order_id,\n                    broker_order_ticket,\n                    broker_deal_ticket,\n                    broker_position_ticket,\n                    symbol,\n                    side,\n                    quantity,\n                    price,\n                    status,\n                    event_type,\n                    timestamp,\n                    metadata,\n                    execution_mode\n                )\n                VALUES\n                (\n                    gen_random_uuid(),\n                    $1,\n                    $2,\n                    $3,\n                    $4,\n                    $5,\n                    $6,\n                    $7,\n                    $8,\n                    $9,\n                    $10,\n                    $11,\n                    NOW(),\n                    $12,\n                    $13\n                )\n                ', str(trade_id), str(oms_order_id) if oms_order_id else None, broker_order_ticket, broker_deal_ticket, broker_position_ticket, order_request.get('symbol'), order_request.get('type'), order_request.get('volume', 0), result.get('price', order_request.get('price', 0)), status, 'RISK_REJECTION' if status == 'REJECTED' and result.get('retcode') == 'RISK_REJECTED' else 'EXECUTION', json.dumps(result, default=str), self.execution_mode)
            logger.info('Trade ledger persisted: oms_order_id=%s order_ticket=%s deal_ticket=%s position_ticket=%s status=%s', oms_order_id, broker_order_ticket, broker_deal_ticket, broker_position_ticket, status)
            return True
        except Exception as e:
            print('TRADE LEDGER INSERT ERROR:', repr(e))
            logger.exception('Trade ledger insert failed: oms_order_id=%s status=%s', oms_order_id, status)
            return False

    def _resolve_broker_position_ticket(self, symbol, magic=202607, retries=12, retry_delay=0.25, order_ticket=None, deal_ticket=None):
        """
        Resolve the authoritative MT5 broker position ticket.

        Identity hierarchy:

            MT5 position.ticket
                |
                +-- direct deal.position_id
                |
                +-- exact symbol + magic
                |
                +-- single symbol position
                |
                +-- latest symbol position

        Important:

            OMS order_id
            MT5 order ticket
            MT5 deal ticket
            MT5 position ticket

        are separate identities.

        The broker position ticket is authoritative for LIVE position
        tracking and closing.
        """
        try:
            symbol = str(symbol)
            try:
                magic = int(magic)
            except (TypeError, ValueError):
                magic = 202607
            retries = max(int(retries), 1)
            retry_delay = max(float(retry_delay), 0.05)
            try:
                order_ticket = int(order_ticket) if order_ticket is not None else None
            except (TypeError, ValueError):
                order_ticket = None
            try:
                deal_ticket = int(deal_ticket) if deal_ticket is not None else None
            except (TypeError, ValueError):
                deal_ticket = None
            logger.info('Resolving MT5 broker position: symbol=%s magic=%s order_ticket=%s deal_ticket=%s', symbol, magic, order_ticket, deal_ticket)
            for attempt in range(1, retries + 1):
                if deal_ticket is not None:
                    try:
                        deal_history = mt5.history_deals_get(ticket=deal_ticket)
                        if deal_history:
                            for deal in deal_history:
                                position_id = getattr(deal, 'position_id', None)
                                deal_symbol = getattr(deal, 'symbol', None)
                                if position_id is not None and str(deal_symbol) == symbol and (int(position_id) > 0):
                                    logger.info('Broker position resolved directly from deal: symbol=%s deal_ticket=%s position_ticket=%s attempt=%s', symbol, deal_ticket, position_id, attempt)
                                    return int(position_id)
                    except Exception as exc:
                        logger.debug('Deal-to-position resolution unavailable: symbol=%s deal_ticket=%s attempt=%s/%s error=%s', symbol, deal_ticket, attempt, retries, exc)
                try:
                    positions = mt5.positions_get(symbol=symbol)
                except Exception as exc:
                    logger.warning('MT5 position lookup exception: symbol=%s attempt=%s/%s error=%s', symbol, attempt, retries, exc)
                    positions = None
                if positions is not None:
                    positions = list(positions)
                    if positions:
                        exact_matches = []
                        for position in positions:
                            position_symbol = getattr(position, 'symbol', None)
                            position_magic = getattr(position, 'magic', None)
                            if str(position_symbol) == symbol and position_magic is not None and (int(position_magic) == magic):
                                exact_matches.append(position)
                        if exact_matches:
                            exact_matches.sort(key=lambda p: getattr(p, 'time_msc', getattr(p, 'time', 0)), reverse=True)
                            ticket = getattr(exact_matches[0], 'ticket', None)
                            if ticket is not None:
                                logger.info('Broker position resolved by symbol + magic: symbol=%s magic=%s ticket=%s attempt=%s', symbol, magic, ticket, attempt)
                                return int(ticket)
                        symbol_matches = [p for p in positions if str(getattr(p, 'symbol', '')) == symbol]
                        if len(symbol_matches) == 1:
                            ticket = getattr(symbol_matches[0], 'ticket', None)
                            if ticket is not None:
                                logger.info('Broker position resolved by single-symbol fallback: symbol=%s ticket=%s attempt=%s', symbol, ticket, attempt)
                                return int(ticket)
                        if symbol_matches:
                            symbol_matches.sort(key=lambda p: getattr(p, 'time_msc', getattr(p, 'time', 0)), reverse=True)
                            ticket = getattr(symbol_matches[0], 'ticket', None)
                            if ticket is not None:
                                logger.info('Broker position resolved by latest-symbol fallback: symbol=%s ticket=%s attempt=%s', symbol, ticket, attempt)
                                return int(ticket)
                else:
                    logger.warning('MT5 positions_get returned None: symbol=%s attempt=%s/%s error=%s', symbol, attempt, retries, mt5.last_error())
                if attempt < retries:
                    time.sleep(retry_delay)
            logger.error('Unable to resolve authoritative MT5 position: symbol=%s magic=%s order_ticket=%s deal_ticket=%s', symbol, magic, order_ticket, deal_ticket)
            return None
        except Exception as exc:
            logger.exception('Broker position resolver failed: %s', exc)
            return None

    def snapshot(self):
        try:
            bridge = mt5_bridge_service.snapshot()
            bridge_status = bridge.get('status', 'unknown')
            terminal = {}
            try:
                terminal = bridge.get('terminal', {})
            except Exception:
                terminal = {}
            connected = 'ONLINE' if bridge_status == 'connected' else 'OFFLINE'
            return {'status': 'ONLINE', 'engine_status': 'ACTIVE', 'bridge_connection_status': connected, 'broker_connection_status': connected, 'execution_latency_ms': self.execution_latency_ms, 'broker_latency_ms': 0, 'slippage_average': 0, 'orders_sent': self.orders_sent, 'orders_filled': self.orders_filled, 'orders_rejected': self.orders_rejected, 'orders_pending': len(bridge.get('orders', [])), 'open_positions': len(position_service.snapshot().get('open_positions', [])) if self.execution_mode == 'PAPER' else len(bridge.get('positions', [])), 'last_order_time': self.last_order_time, 'last_fill_time': self.last_fill_time, 'last_error': self.last_error, 'execution_mode': self.execution_mode, 'heartbeat': time.time(), 'health_score': 100 if connected == 'ONLINE' else 50, 'uptime': round(time.time() - self.started_at, 2)}
        except Exception as e:
            logger.error('Execution snapshot failure: %s', e)
            return {'status': 'ERROR', 'engine_status': 'DEGRADED', 'bridge_connection_status': 'UNKNOWN', 'broker_connection_status': 'UNKNOWN', 'last_error': str(e), 'heartbeat': time.time(), 'health_score': 0}
execution_service = ExecutionService()




