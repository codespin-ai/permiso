--
-- PostgreSQL database dump
--

-- Dumped from database version 16.4 (Debian 16.4-1.pgdg120+1)
-- Dumped by pg_dump version 16.9 (Ubuntu 16.9-0ubuntu0.24.04.1)

-- Started on 2025-08-01 23:22:41 IST

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP DATABASE IF EXISTS permiso;
--
-- TOC entry 3482 (class 1262 OID 16384)
-- Name: permiso; Type: DATABASE; Schema: -; Owner: -
--

CREATE DATABASE permiso WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


\connect permiso

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_table_access_method = heap;

--
-- TOC entry 216 (class 1259 OID 16390)
-- Name: knex_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.knex_migrations (
    id integer NOT NULL,
    name character varying(255),
    batch integer,
    migration_time timestamp with time zone
);


--
-- TOC entry 215 (class 1259 OID 16389)
-- Name: knex_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.knex_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3483 (class 0 OID 0)
-- Dependencies: 215
-- Name: knex_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.knex_migrations_id_seq OWNED BY public.knex_migrations.id;


--
-- TOC entry 218 (class 1259 OID 16397)
-- Name: knex_migrations_lock; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.knex_migrations_lock (
    index integer NOT NULL,
    is_locked integer
);


--
-- TOC entry 217 (class 1259 OID 16396)
-- Name: knex_migrations_lock_index_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.knex_migrations_lock_index_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3484 (class 0 OID 0)
-- Dependencies: 217
-- Name: knex_migrations_lock_index_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.knex_migrations_lock_index_seq OWNED BY public.knex_migrations_lock.index;


--
-- TOC entry 219 (class 1259 OID 16501)
-- Name: organization; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organization (
    id character varying(255) NOT NULL,
    data text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    name character varying(255) DEFAULT ''::character varying NOT NULL,
    description text
);


--
-- TOC entry 220 (class 1259 OID 16513)
-- Name: organization_property; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organization_property (
    parent_id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    value jsonb NOT NULL,
    hidden boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 225 (class 1259 OID 16599)
-- Name: resource; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resource (
    id character varying(255) NOT NULL,
    org_id character varying(255) NOT NULL,
    data text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    name character varying(255),
    description text
);


--
-- TOC entry 221 (class 1259 OID 16530)
-- Name: role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role (
    id character varying(255) NOT NULL,
    org_id character varying(255) NOT NULL,
    data text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    name character varying(255) DEFAULT ''::character varying NOT NULL,
    description text
);


--
-- TOC entry 228 (class 1259 OID 16657)
-- Name: role_permission; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permission (
    role_id character varying(255) NOT NULL,
    org_id character varying(255) NOT NULL,
    resource_id character varying(255) NOT NULL,
    action character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 222 (class 1259 OID 16548)
-- Name: role_property; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_property (
    parent_id character varying(255) NOT NULL,
    org_id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    value jsonb NOT NULL,
    hidden boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 223 (class 1259 OID 16565)
-- Name: user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."user" (
    id character varying(255) NOT NULL,
    org_id character varying(255) NOT NULL,
    identity_provider character varying(255) NOT NULL,
    identity_provider_user_id character varying(255) NOT NULL,
    data text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 227 (class 1259 OID 16636)
-- Name: user_permission; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_permission (
    user_id character varying(255) NOT NULL,
    org_id character varying(255) NOT NULL,
    resource_id character varying(255) NOT NULL,
    action character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 224 (class 1259 OID 16582)
-- Name: user_property; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_property (
    parent_id character varying(255) NOT NULL,
    org_id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    value jsonb NOT NULL,
    hidden boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 226 (class 1259 OID 16616)
-- Name: user_role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_role (
    user_id character varying(255) NOT NULL,
    role_id character varying(255) NOT NULL,
    org_id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 3248 (class 2604 OID 16393)
-- Name: knex_migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knex_migrations ALTER COLUMN id SET DEFAULT nextval('public.knex_migrations_id_seq'::regclass);


--
-- TOC entry 3249 (class 2604 OID 16400)
-- Name: knex_migrations_lock index; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knex_migrations_lock ALTER COLUMN index SET DEFAULT nextval('public.knex_migrations_lock_index_seq'::regclass);


--
-- TOC entry 3272 (class 2606 OID 16402)
-- Name: knex_migrations_lock knex_migrations_lock_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knex_migrations_lock
    ADD CONSTRAINT knex_migrations_lock_pkey PRIMARY KEY (index);


--
-- TOC entry 3270 (class 2606 OID 16395)
-- Name: knex_migrations knex_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knex_migrations
    ADD CONSTRAINT knex_migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 3276 (class 2606 OID 16510)
-- Name: organization organization_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization
    ADD CONSTRAINT organization_pkey PRIMARY KEY (id);


--
-- TOC entry 3280 (class 2606 OID 16521)
-- Name: organization_property organization_property_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_property
    ADD CONSTRAINT organization_property_pkey PRIMARY KEY (parent_id, name);


--
-- TOC entry 3307 (class 2606 OID 16607)
-- Name: resource resource_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource
    ADD CONSTRAINT resource_pkey PRIMARY KEY (id, org_id);


--
-- TOC entry 3319 (class 2606 OID 16664)
-- Name: role_permission role_permission_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permission
    ADD CONSTRAINT role_permission_pkey PRIMARY KEY (role_id, org_id, resource_id, action);


--
-- TOC entry 3286 (class 2606 OID 16539)
-- Name: role role_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role
    ADD CONSTRAINT role_pkey PRIMARY KEY (id, org_id);


--
-- TOC entry 3290 (class 2606 OID 16556)
-- Name: role_property role_property_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_property
    ADD CONSTRAINT role_property_pkey PRIMARY KEY (parent_id, org_id, name);


--
-- TOC entry 3314 (class 2606 OID 16643)
-- Name: user_permission user_permission_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permission
    ADD CONSTRAINT user_permission_pkey PRIMARY KEY (user_id, org_id, resource_id, action);


--
-- TOC entry 3296 (class 2606 OID 16573)
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id, org_id);


--
-- TOC entry 3300 (class 2606 OID 16590)
-- Name: user_property user_property_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_property
    ADD CONSTRAINT user_property_pkey PRIMARY KEY (parent_id, org_id, name);


--
-- TOC entry 3309 (class 2606 OID 16623)
-- Name: user_role user_role_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_role
    ADD CONSTRAINT user_role_pkey PRIMARY KEY (user_id, role_id, org_id);


--
-- TOC entry 3273 (class 1259 OID 16511)
-- Name: organization_created_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX organization_created_at_index ON public.organization USING btree (created_at);


--
-- TOC entry 3274 (class 1259 OID 16512)
-- Name: organization_name_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX organization_name_index ON public.organization USING btree (name);


--
-- TOC entry 3277 (class 1259 OID 16527)
-- Name: organization_property_hidden_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX organization_property_hidden_index ON public.organization_property USING btree (hidden);


--
-- TOC entry 3278 (class 1259 OID 16528)
-- Name: organization_property_name_value_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX organization_property_name_value_index ON public.organization_property USING btree (name, value);


--
-- TOC entry 3281 (class 1259 OID 16529)
-- Name: organization_property_value_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX organization_property_value_index ON public.organization_property USING gin (value);


--
-- TOC entry 3302 (class 1259 OID 16613)
-- Name: resource_created_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX resource_created_at_index ON public.resource USING btree (created_at);


--
-- TOC entry 3303 (class 1259 OID 16678)
-- Name: resource_id text_pattern_ops_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "resource_id text_pattern_ops_index" ON public.resource USING btree (id text_pattern_ops);


--
-- TOC entry 3304 (class 1259 OID 16614)
-- Name: resource_org_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX resource_org_id_index ON public.resource USING btree (org_id);


--
-- TOC entry 3305 (class 1259 OID 16615)
-- Name: resource_org_id_name_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX resource_org_id_name_index ON public.resource USING btree (org_id, name);


--
-- TOC entry 3282 (class 1259 OID 16545)
-- Name: role_created_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX role_created_at_index ON public.role USING btree (created_at);


--
-- TOC entry 3283 (class 1259 OID 16546)
-- Name: role_org_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX role_org_id_index ON public.role USING btree (org_id);


--
-- TOC entry 3284 (class 1259 OID 16547)
-- Name: role_org_id_name_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX role_org_id_name_index ON public.role USING btree (org_id, name);


--
-- TOC entry 3317 (class 1259 OID 16677)
-- Name: role_permission_action_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX role_permission_action_index ON public.role_permission USING btree (action);


--
-- TOC entry 3320 (class 1259 OID 16676)
-- Name: role_permission_resource_id_org_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX role_permission_resource_id_org_id_index ON public.role_permission USING btree (resource_id, org_id);


--
-- TOC entry 3321 (class 1259 OID 16675)
-- Name: role_permission_role_id_org_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX role_permission_role_id_org_id_index ON public.role_permission USING btree (role_id, org_id);


--
-- TOC entry 3287 (class 1259 OID 16562)
-- Name: role_property_hidden_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX role_property_hidden_index ON public.role_property USING btree (hidden);


--
-- TOC entry 3288 (class 1259 OID 16563)
-- Name: role_property_name_value_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX role_property_name_value_index ON public.role_property USING btree (name, value);


--
-- TOC entry 3291 (class 1259 OID 16564)
-- Name: role_property_value_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX role_property_value_index ON public.role_property USING gin (value);


--
-- TOC entry 3292 (class 1259 OID 16579)
-- Name: user_created_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_created_at_index ON public."user" USING btree (created_at);


--
-- TOC entry 3293 (class 1259 OID 16581)
-- Name: user_identity_provider_identity_provider_user_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_identity_provider_identity_provider_user_id_index ON public."user" USING btree (identity_provider, identity_provider_user_id);


--
-- TOC entry 3294 (class 1259 OID 16580)
-- Name: user_org_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_org_id_index ON public."user" USING btree (org_id);


--
-- TOC entry 3312 (class 1259 OID 16656)
-- Name: user_permission_action_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_permission_action_index ON public.user_permission USING btree (action);


--
-- TOC entry 3315 (class 1259 OID 16655)
-- Name: user_permission_resource_id_org_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_permission_resource_id_org_id_index ON public.user_permission USING btree (resource_id, org_id);


--
-- TOC entry 3316 (class 1259 OID 16654)
-- Name: user_permission_user_id_org_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_permission_user_id_org_id_index ON public.user_permission USING btree (user_id, org_id);


--
-- TOC entry 3297 (class 1259 OID 16596)
-- Name: user_property_hidden_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_property_hidden_index ON public.user_property USING btree (hidden);


--
-- TOC entry 3298 (class 1259 OID 16597)
-- Name: user_property_name_value_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_property_name_value_index ON public.user_property USING btree (name, value);


--
-- TOC entry 3301 (class 1259 OID 16598)
-- Name: user_property_value_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_property_value_index ON public.user_property USING gin (value);


--
-- TOC entry 3310 (class 1259 OID 16635)
-- Name: user_role_role_id_org_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_role_role_id_org_id_index ON public.user_role USING btree (role_id, org_id);


--
-- TOC entry 3311 (class 1259 OID 16634)
-- Name: user_role_user_id_org_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_role_user_id_org_id_index ON public.user_role USING btree (user_id, org_id);


--
-- TOC entry 3322 (class 2606 OID 16522)
-- Name: organization_property organization_property_parent_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_property
    ADD CONSTRAINT organization_property_parent_id_foreign FOREIGN KEY (parent_id) REFERENCES public.organization(id) ON DELETE CASCADE;


--
-- TOC entry 3327 (class 2606 OID 16608)
-- Name: resource resource_org_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource
    ADD CONSTRAINT resource_org_id_foreign FOREIGN KEY (org_id) REFERENCES public.organization(id) ON DELETE CASCADE;


--
-- TOC entry 3323 (class 2606 OID 16540)
-- Name: role role_org_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role
    ADD CONSTRAINT role_org_id_foreign FOREIGN KEY (org_id) REFERENCES public.organization(id) ON DELETE CASCADE;


--
-- TOC entry 3332 (class 2606 OID 16670)
-- Name: role_permission role_permission_resource_id_org_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permission
    ADD CONSTRAINT role_permission_resource_id_org_id_foreign FOREIGN KEY (resource_id, org_id) REFERENCES public.resource(id, org_id) ON DELETE CASCADE;


--
-- TOC entry 3333 (class 2606 OID 16665)
-- Name: role_permission role_permission_role_id_org_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permission
    ADD CONSTRAINT role_permission_role_id_org_id_foreign FOREIGN KEY (role_id, org_id) REFERENCES public.role(id, org_id) ON DELETE CASCADE;


--
-- TOC entry 3324 (class 2606 OID 16557)
-- Name: role_property role_property_parent_id_org_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_property
    ADD CONSTRAINT role_property_parent_id_org_id_foreign FOREIGN KEY (parent_id, org_id) REFERENCES public.role(id, org_id) ON DELETE CASCADE;


--
-- TOC entry 3325 (class 2606 OID 16574)
-- Name: user user_org_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_org_id_foreign FOREIGN KEY (org_id) REFERENCES public.organization(id) ON DELETE CASCADE;


--
-- TOC entry 3330 (class 2606 OID 16649)
-- Name: user_permission user_permission_resource_id_org_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permission
    ADD CONSTRAINT user_permission_resource_id_org_id_foreign FOREIGN KEY (resource_id, org_id) REFERENCES public.resource(id, org_id) ON DELETE CASCADE;


--
-- TOC entry 3331 (class 2606 OID 16644)
-- Name: user_permission user_permission_user_id_org_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permission
    ADD CONSTRAINT user_permission_user_id_org_id_foreign FOREIGN KEY (user_id, org_id) REFERENCES public."user"(id, org_id) ON DELETE CASCADE;


--
-- TOC entry 3326 (class 2606 OID 16591)
-- Name: user_property user_property_parent_id_org_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_property
    ADD CONSTRAINT user_property_parent_id_org_id_foreign FOREIGN KEY (parent_id, org_id) REFERENCES public."user"(id, org_id) ON DELETE CASCADE;


--
-- TOC entry 3328 (class 2606 OID 16629)
-- Name: user_role user_role_role_id_org_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_role
    ADD CONSTRAINT user_role_role_id_org_id_foreign FOREIGN KEY (role_id, org_id) REFERENCES public.role(id, org_id) ON DELETE CASCADE;


--
-- TOC entry 3329 (class 2606 OID 16624)
-- Name: user_role user_role_user_id_org_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_role
    ADD CONSTRAINT user_role_user_id_org_id_foreign FOREIGN KEY (user_id, org_id) REFERENCES public."user"(id, org_id) ON DELETE CASCADE;


-- Completed on 2025-08-01 23:22:41 IST

--
-- PostgreSQL database dump complete
--

