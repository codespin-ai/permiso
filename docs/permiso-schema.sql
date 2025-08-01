--
-- PostgreSQL database dump
--



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
-- Name: knex_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.knex_migrations (
    id integer NOT NULL,
    name character varying(255),
    batch integer,
    migration_time timestamp with time zone
);


--
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
-- Dependencies: 215
-- Name: knex_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.knex_migrations_id_seq OWNED BY public.knex_migrations.id;


--
-- Name: knex_migrations_lock; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.knex_migrations_lock (
    index integer NOT NULL,
    is_locked integer
);


--
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
-- Dependencies: 217
-- Name: knex_migrations_lock_index_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.knex_migrations_lock_index_seq OWNED BY public.knex_migrations_lock.index;


--
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
-- Name: user_role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_role (
    user_id character varying(255) NOT NULL,
    role_id character varying(255) NOT NULL,
    org_id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: knex_migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knex_migrations ALTER COLUMN id SET DEFAULT nextval('public.knex_migrations_id_seq'::regclass);


--
-- Name: knex_migrations_lock index; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knex_migrations_lock ALTER COLUMN index SET DEFAULT nextval('public.knex_migrations_lock_index_seq'::regclass);


--
-- Name: knex_migrations_lock knex_migrations_lock_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knex_migrations_lock
    ADD CONSTRAINT knex_migrations_lock_pkey PRIMARY KEY (index);


--
-- Name: knex_migrations knex_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knex_migrations
    ADD CONSTRAINT knex_migrations_pkey PRIMARY KEY (id);


--
-- Name: organization organization_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization
    ADD CONSTRAINT organization_pkey PRIMARY KEY (id);


--
-- Name: organization_property organization_property_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_property
    ADD CONSTRAINT organization_property_pkey PRIMARY KEY (parent_id, name);


--
-- Name: resource resource_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource
    ADD CONSTRAINT resource_pkey PRIMARY KEY (id, org_id);


--
-- Name: role_permission role_permission_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permission
    ADD CONSTRAINT role_permission_pkey PRIMARY KEY (role_id, org_id, resource_id, action);


--
-- Name: role role_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role
    ADD CONSTRAINT role_pkey PRIMARY KEY (id, org_id);


--
-- Name: role_property role_property_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_property
    ADD CONSTRAINT role_property_pkey PRIMARY KEY (parent_id, org_id, name);


--
-- Name: user_permission user_permission_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permission
    ADD CONSTRAINT user_permission_pkey PRIMARY KEY (user_id, org_id, resource_id, action);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id, org_id);


--
-- Name: user_property user_property_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_property
    ADD CONSTRAINT user_property_pkey PRIMARY KEY (parent_id, org_id, name);


--
-- Name: user_role user_role_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_role
    ADD CONSTRAINT user_role_pkey PRIMARY KEY (user_id, role_id, org_id);


--
-- Name: organization_created_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX organization_created_at_index ON public.organization USING btree (created_at);


--
-- Name: organization_name_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX organization_name_index ON public.organization USING btree (name);


--
-- Name: organization_property_hidden_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX organization_property_hidden_index ON public.organization_property USING btree (hidden);


--
-- Name: organization_property_name_value_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX organization_property_name_value_index ON public.organization_property USING btree (name, value);


--
-- Name: organization_property_value_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX organization_property_value_index ON public.organization_property USING gin (value);


--
-- Name: resource_created_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX resource_created_at_index ON public.resource USING btree (created_at);


--
-- Name: resource_id text_pattern_ops_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "resource_id text_pattern_ops_index" ON public.resource USING btree (id text_pattern_ops);


--
-- Name: resource_org_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX resource_org_id_index ON public.resource USING btree (org_id);


--
-- Name: resource_org_id_name_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX resource_org_id_name_index ON public.resource USING btree (org_id, name);


--
-- Name: role_created_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX role_created_at_index ON public.role USING btree (created_at);


--
-- Name: role_org_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX role_org_id_index ON public.role USING btree (org_id);


--
-- Name: role_org_id_name_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX role_org_id_name_index ON public.role USING btree (org_id, name);


--
-- Name: role_permission_action_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX role_permission_action_index ON public.role_permission USING btree (action);


--
-- Name: role_permission_resource_id_org_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX role_permission_resource_id_org_id_index ON public.role_permission USING btree (resource_id, org_id);


--
-- Name: role_permission_role_id_org_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX role_permission_role_id_org_id_index ON public.role_permission USING btree (role_id, org_id);


--
-- Name: role_property_hidden_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX role_property_hidden_index ON public.role_property USING btree (hidden);


--
-- Name: role_property_name_value_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX role_property_name_value_index ON public.role_property USING btree (name, value);


--
-- Name: role_property_value_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX role_property_value_index ON public.role_property USING gin (value);


--
-- Name: user_created_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_created_at_index ON public."user" USING btree (created_at);


--
-- Name: user_identity_provider_identity_provider_user_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_identity_provider_identity_provider_user_id_index ON public."user" USING btree (identity_provider, identity_provider_user_id);


--
-- Name: user_org_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_org_id_index ON public."user" USING btree (org_id);


--
-- Name: user_permission_action_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_permission_action_index ON public.user_permission USING btree (action);


--
-- Name: user_permission_resource_id_org_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_permission_resource_id_org_id_index ON public.user_permission USING btree (resource_id, org_id);


--
-- Name: user_permission_user_id_org_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_permission_user_id_org_id_index ON public.user_permission USING btree (user_id, org_id);


--
-- Name: user_property_hidden_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_property_hidden_index ON public.user_property USING btree (hidden);


--
-- Name: user_property_name_value_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_property_name_value_index ON public.user_property USING btree (name, value);


--
-- Name: user_property_value_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_property_value_index ON public.user_property USING gin (value);


--
-- Name: user_role_role_id_org_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_role_role_id_org_id_index ON public.user_role USING btree (role_id, org_id);


--
-- Name: user_role_user_id_org_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_role_user_id_org_id_index ON public.user_role USING btree (user_id, org_id);


--
-- Name: organization_property organization_property_parent_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_property
    ADD CONSTRAINT organization_property_parent_id_foreign FOREIGN KEY (parent_id) REFERENCES public.organization(id) ON DELETE CASCADE;


--
-- Name: resource resource_org_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource
    ADD CONSTRAINT resource_org_id_foreign FOREIGN KEY (org_id) REFERENCES public.organization(id) ON DELETE CASCADE;


--
-- Name: role role_org_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role
    ADD CONSTRAINT role_org_id_foreign FOREIGN KEY (org_id) REFERENCES public.organization(id) ON DELETE CASCADE;


--
-- Name: role_permission role_permission_resource_id_org_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permission
    ADD CONSTRAINT role_permission_resource_id_org_id_foreign FOREIGN KEY (resource_id, org_id) REFERENCES public.resource(id, org_id) ON DELETE CASCADE;


--
-- Name: role_permission role_permission_role_id_org_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permission
    ADD CONSTRAINT role_permission_role_id_org_id_foreign FOREIGN KEY (role_id, org_id) REFERENCES public.role(id, org_id) ON DELETE CASCADE;


--
-- Name: role_property role_property_parent_id_org_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_property
    ADD CONSTRAINT role_property_parent_id_org_id_foreign FOREIGN KEY (parent_id, org_id) REFERENCES public.role(id, org_id) ON DELETE CASCADE;


--
-- Name: user user_org_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_org_id_foreign FOREIGN KEY (org_id) REFERENCES public.organization(id) ON DELETE CASCADE;


--
-- Name: user_permission user_permission_resource_id_org_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permission
    ADD CONSTRAINT user_permission_resource_id_org_id_foreign FOREIGN KEY (resource_id, org_id) REFERENCES public.resource(id, org_id) ON DELETE CASCADE;


--
-- Name: user_permission user_permission_user_id_org_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permission
    ADD CONSTRAINT user_permission_user_id_org_id_foreign FOREIGN KEY (user_id, org_id) REFERENCES public."user"(id, org_id) ON DELETE CASCADE;


--
-- Name: user_property user_property_parent_id_org_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_property
    ADD CONSTRAINT user_property_parent_id_org_id_foreign FOREIGN KEY (parent_id, org_id) REFERENCES public."user"(id, org_id) ON DELETE CASCADE;


--
-- Name: user_role user_role_role_id_org_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_role
    ADD CONSTRAINT user_role_role_id_org_id_foreign FOREIGN KEY (role_id, org_id) REFERENCES public.role(id, org_id) ON DELETE CASCADE;


--
-- Name: user_role user_role_user_id_org_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_role
    ADD CONSTRAINT user_role_user_id_org_id_foreign FOREIGN KEY (user_id, org_id) REFERENCES public."user"(id, org_id) ON DELETE CASCADE;



--
-- PostgreSQL database dump complete
--

